const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, 'src', 'lib', 'models');
if (fs.existsSync(modelsDir)) {
  fs.readdirSync(modelsDir).forEach(file => {
    if (file.endsWith('.js') || file.endsWith('.ts')) {
      const filePath = path.join(modelsDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Add role to User schema if not exists
      if (file === 'User.js' && !content.includes('role:')) {
        content = content.replace('stripe_customer_id: {', 'role: { type: String, enum: ["user", "admin"], default: "user" },\n  stripe_customer_id: {');
      }

      // Replace export const ModelName = mongoose.model('ModelName', schema);
      // with export const ModelName = mongoose.models.ModelName || mongoose.model('ModelName', schema);
      content = content.replace(/export\s+const\s+(\w+)\s*=\s*mongoose\.model\(['"]\w+['"],\s*\w+\);/g, (match, modelName) => {
        return `export const ${modelName} = mongoose.models.${modelName} || ${match.replace(`export const ${modelName} = `, '')}`;
      });

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed model ${file}`);
    }
  });
}
