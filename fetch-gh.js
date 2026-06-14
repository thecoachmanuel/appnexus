import mongoose from 'mongoose';
const schema = new mongoose.Schema({ provider: String, config: mongoose.Schema.Types.Mixed, is_active: Boolean });
const ApiConfig = mongoose.models.ApiConfiguration || mongoose.model('ApiConfiguration', schema);
async function run() {
  await mongoose.connect('mongodb+srv://appnexus:fsZuyi1Bt6ka08rX@cluster0.0dnl6.mongodb.net/appnexus?appName=Cluster0');
  const config = await ApiConfig.findOne({ provider: 'github' });
  if (config) {
    const { github_pat, repo_owner, repo_name, workflow_id } = config.config;
    const url = `https://api.github.com/repos/${repo_owner}/${repo_name}/actions/workflows/${workflow_id || 'build-android.yml'}/runs?per_page=5`;
    const res = await fetch(url, { headers: { 'Authorization': `token ${github_pat}` }});
    const data = await res.json();
    if (!res.ok) {
        console.log("Error:", data);
        process.exit(1);
    }
    console.log("Found", data.workflow_runs?.length, "runs");
    if (data.workflow_runs) {
        data.workflow_runs.forEach(r => console.log(r.status, r.conclusion));
    }
  }
  process.exit(0);
}
run();
