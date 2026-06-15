const fs = require('fs');
async function test() {
  const ghResponse = await fetch('https://api.github.com/repos/thecoachmanuel/appnexus/actions/workflows/build-android.yml/runs?per_page=5');
  const data = await ghResponse.json();
  console.log(JSON.stringify(data.workflow_runs.map(r => ({ name: r.name, display_title: r.display_title, status: r.status, conclusion: r.conclusion })), null, 2));
}
test();
