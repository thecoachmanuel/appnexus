import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import mongoose from 'mongoose';
import { AppBuild } from '@/lib/models/AppBuild';
import { ApiConfiguration } from '@/lib/models/ApiConfiguration';
import { User } from '@/lib/models/User';
import { SystemSetting } from '@/lib/models/SystemSetting';
import { verifyToken } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    await connectToDatabase();
    const builds = await AppBuild.find({ user_id: decoded.id }).sort({ createdAt: -1 });
    return NextResponse.json(builds);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as any;
    if (!decoded || !decoded.id) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    await connectToDatabase();

    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const setting = await SystemSetting.findOne({ key: 'credits_per_build' });
    const creditsPerBuild = setting ? Number(setting.value) : 1;

    if (user.credits < creditsPerBuild) {
      return NextResponse.json({ error: `Insufficient credits. You need ${creditsPerBuild} credits to build an app.` }, { status: 402 });
    }

    // Deduct credits
    user.credits -= creditsPerBuild;
    await user.save();

    const buildId = new mongoose.Types.ObjectId();
    const requestUrl = new URL(req.url);
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || requestUrl.origin;

    const build = await AppBuild.create({
      _id: buildId,
      user_id: decoded.id,
      app_name: body.appName || 'AppNexus',
      package_name: `com.app.${(body.appName || 'appnexus').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      website_url: body.websiteUrl || baseUrl,
      config: body,
      status: 'building',
      progress: 0,
      download_url: null
    });

    const githubConfig = await ApiConfiguration.findOne({ provider: 'github', is_active: true });

    if (!githubConfig || !githubConfig.config?.github_pat) {
      build.status = 'failed';
      await build.save();
      return NextResponse.json({ error: 'GitHub Actions is not configured.' }, { status: 400 });
    }

    const github_pat = githubConfig.config.github_pat?.trim();
    const repo_owner = githubConfig.config.repo_owner?.trim();
    const repo_name = githubConfig.config.repo_name?.trim();
    const workflow_id = githubConfig.config.workflow_id?.trim();
    const webhook_url = `${baseUrl}/api/webhooks/github`;

    const ghResponse = await fetch(`https://api.github.com/repos/${repo_owner}/${repo_name}/actions/workflows/${workflow_id || 'build-android.yml'}/dispatches`, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${github_pat}`,
        'Content-Type': 'application/json',
        'User-Agent': 'AppForge-Builder'
      },
      body: JSON.stringify({
        ref: 'main',
        inputs: {
          app_name: body.appName || 'AppNexus',
          package_name: build.package_name,
          website_url: body.websiteUrl || baseUrl,
          build_id: buildId.toString(),
          webhook_url: webhook_url
        }
      })
    });

    if (!ghResponse.ok) {
      const errRes = await ghResponse.text();
      console.error('GitHub Actions Dispatch Error:', errRes);
      build.status = 'failed';
      await build.save();
      
      // Refund credits
      user.credits += creditsPerBuild;
      await user.save();

      return NextResponse.json({ error: `Failed to trigger GitHub Action: ${ghResponse.statusText}` }, { status: 500 });
    }

    return NextResponse.json({ buildId: build._id, message: 'Started' }, { status: 201 });
  } catch (error: any) {
    console.error("Build POST error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}