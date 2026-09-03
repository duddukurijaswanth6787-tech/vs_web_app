const fs = require('fs');
const path = require('path');
const os = require('os');

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.railway', 'config.json'), 'utf8'));
const token = cfg.user.accessToken;

async function main() {
  const query = `
    query GetDeployments {
      service(id: "e8665d52-3b28-41ce-a31a-a2b121074ba1") {
        id
        name
        deployments(first: 10) {
          edges {
            node {
              id
              status
              createdAt
              meta
            }
          }
        }
      }
    }
  `;

  const res = await fetch('https://backboard.railway.app/graphql/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  const deployments = data.data?.service?.deployments?.edges || [];
  console.log('--- LATEST RAILWAY DEPLOYMENTS ---');
  deployments.slice(0, 5).forEach(({ node }) => {
    console.log(`[${node.status}] ID: ${node.id} | Created: ${node.createdAt}`);
    console.log(`  Commit: ${node.meta?.commitHash} - ${node.meta?.commitMessage}`);
    console.log(`  Branch: ${node.meta?.branch} | Reason: ${node.meta?.reason}`);
  });
}

main().catch(console.error);
