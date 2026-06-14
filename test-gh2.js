import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const schema = new mongoose.Schema({
  provider: String,
  config: mongoose.Schema.Types.Mixed,
  is_active: Boolean
});
const ApiConfig = mongoose.models.ApiConfiguration || mongoose.model('ApiConfiguration', schema);

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const config = await ApiConfig.findOne({ provider: 'github' });
  console.log('Found config:', !!config);
  
  if (config) {
    const { github_pat, repo_owner, repo_name, workflow_id } = config.config;
    const url = `https://api.github.com/repos/${repo_owner}/${repo_name}/actions/workflows/${workflow_id || 'build-android.yml'}/runs?per_page=5`;
    console.log('Fetching', url);
    const res = await fetch(url, { headers: { 'Authorization': `token ${github_pat}` }});
    const data = await res.json();
    if (data.workflow_runs) {
        data.workflow_runs.forEach((r, i) => {
            console.log(`Run ${i}: status=${r.status}, conclusion=${r.conclusion}, created_at=${r.created_at}`);
        });
    } else {
        console.log("No workflow runs:", data);
    }
  }
  process.exit(0);
}
run();
