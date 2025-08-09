// Simple redirect to Next.js
// Since this project was migrated to Next.js, redirect to the Next.js dev server
console.log('This project has been migrated to Next.js.');
console.log('Please update the package.json scripts to use Next.js commands:');
console.log('  "dev": "next dev -p 5000"');
console.log('  "build": "next build"');
console.log('  "start": "next start -p 5000"');

// For now, let's just run a simple server that shows this message
import express from 'express';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

app.get('*', (req, res) => {
  res.send(`
    <html>
      <head><title>ConstructPro - Setup Required</title></head>
      <body style="font-family: Arial, sans-serif; padding: 40px; background: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h1 style="color: #FF6B35;">ConstructPro - Construction Management Platform</h1>
          <h2>Setup Required</h2>
          <p>This project has been migrated to Next.js but the package.json still references the old Express setup.</p>
          <p><strong>To fix this, update the package.json scripts to:</strong></p>
          <pre style="background: #f0f0f0; padding: 15px; border-radius: 4px; overflow-x: auto;">
"scripts": {
  "dev": "next dev -p 5000",
  "build": "next build", 
  "start": "next start -p 5000",
  "check": "tsc",
  "db:push": "drizzle-kit push"
}</pre>
          <p>The server is running correctly, but needs the proper Next.js configuration to serve the application.</p>
          <p style="color: #666; margin-top: 30px;"><em>Server running on port ${PORT}</em></p>
        </div>
      </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Setup message server running on port ${PORT}`);
  console.log('Visit http://localhost:5000 for setup instructions');
});