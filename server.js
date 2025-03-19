const http = require('http');
const spawn = require('child_process').spawn;
const fs = require('fs');
const path = require('path');
const config = require('./config');

const repoDir = config.repoDir;

http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // Parse URL to get repository name
  const urlParts = req.url.split('/');
  let repoName = urlParts[1] ? urlParts[1].split('?')[0] : '';
  
  if (!repoName) {
    res.statusCode = 404;
    return res.end('Repository not specified');
  }
  
  if (!repoName.endsWith('.git')) {
    repoName += '.git';
  }
  
  const repoPath = path.join(repoDir, repoName);
  
  if (!fs.existsSync(repoPath)) {
    console.log(`Repository not found: ${repoPath}`);
    res.statusCode = 404;
    return res.end('Repository not found');
  }

  // Handle info/refs endpoint (for git clone, pull, fetch, push discovery)
  if (req.url.includes('/info/refs')) {
    const query = req.url.split('?')[1] || '';
    const params = new URLSearchParams(query);
    const service = params.get('service');
    
    if (!service) {
      res.statusCode = 400;
      return res.end('Service parameter required');
    }
    
    console.log(`Handling info/refs for ${service}`);
    
    res.setHeader('Content-Type', `application/x-${service}-advertisement`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Execute git command to get refs
    const cmd = spawn('git', [
      service.replace('git-', ''),
      '--stateless-rpc',
      '--advertise-refs',
      repoPath
    ]);

    // CRITICAL: Correctly format preamble with proper length
    const preambleStr = `# service=${service}\n`;
    const preambleLen = (preambleStr.length + 4).toString(16).padStart(4, '0');
    const preamble = `${preambleLen}${preambleStr}0000`;
    
    console.log(`Writing preamble: ${preamble}`);
    res.write(preamble);
    
    cmd.stdout.pipe(res);
    
    cmd.stderr.on('data', data => {
      console.error(`stderr: ${data}`);
    });
  }
  // Handle git-upload-pack endpoint (for git pull/fetch)
  else if (req.url.includes('/git-upload-pack')) {
    res.setHeader('Content-Type', 'application/x-git-upload-pack-result');
    handleGitService(req, res, 'upload-pack', repoPath);
  }
  // Handle git-receive-pack endpoint (for git push)
  else if (req.url.includes('/git-receive-pack')) {
    res.setHeader('Content-Type', 'application/x-git-receive-pack-result');
    handleGitService(req, res, 'receive-pack', repoPath);
  }
  else {
    res.statusCode = 400;
    res.end('Bad Request');
  }
  
}).listen(config.port, () => {
  console.log(`Git HTTP server running on port ${config.port}`);
  console.log(`Repository directory: ${repoDir}`);
});

// Helper function to handle git service requests
function handleGitService(req, res, service, repoPath) {
  // Collect request body
  const bodyChunks = [];
  req.on('data', chunk => {
    bodyChunks.push(chunk);
  });
  
  req.on('end', () => {
    const body = Buffer.concat(bodyChunks);
    
    const cmd = spawn('git', [
      service,
      '--stateless-rpc',
      repoPath
    ]);
    
    // Write request body to git process
    cmd.stdin.write(body);
    cmd.stdin.end();
    
    // Stream git output to response
    cmd.stdout.pipe(res);
    
    cmd.stderr.on('data', data => {
      console.error(`stderr: ${data}`);
    });
    
    cmd.on('close', code => {
      console.log(`${service} process exited with code ${code}`);
      res.end();
    });
  });
}