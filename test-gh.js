require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

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
    const url = `https://api.github.com/repos/${repo_owner}/${repo_name}/actions/workflows/${workflow_id || 'build-android.yml'}/runs?per_page=3`;
    console.log('Fetching', url);
    const res = await fetch(url, { headers: { 'Authorization': `token ${github_pat}` }});
    const data = await res.json();
    console.log('Total runs:', data.total_count);
    if (data.workflow_runs && data.workflow_runs.length > 0) {
      console.log('Latest status:', data.workflow_runs[0].status);
      console.log('Latest conclusion:', data.workflow_runs[0].conclusion);
      
      const artRes = await fetch(data.workflow_runs[0].artifacts_url, { headers: { 'Authorization': `token ${github_pat}` }});
      const artData = await artRes.json();
      console.log('Artifacts:', artData.artifacts?.length);
    }
  }
  process.exit(0);
}
run();
