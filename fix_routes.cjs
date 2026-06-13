const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/app/admin-setup/page.tsx',
  'src/app/admin/page.tsx',
  'src/app/auth/page.tsx',
  'src/app/dashboard/page.tsx',
  'src/app/help/page.tsx',
  'src/app/not-found.tsx',
  'src/app/payment-history/page.tsx',
  'src/app/settings/page.tsx'
];

filesToFix.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace imports
  content = content.replace(/import\s+\{\s*useNavigate\s*\}\s+from\s+['"]react-router-dom['"];?/g, 'import { useRouter } from "next/navigation";');
  content = content.replace(/import\s+\{\s*Link\s*\}\s+from\s+['"]react-router-dom['"];?/g, 'import Link from "next/link";');
  content = content.replace(/import\s+\{\s*useLocation\s*\}\s+from\s+['"]react-router-dom['"];?/g, 'import { usePathname } from "next/navigation";');
  content = content.replace(/import\s+\{\s*Navigate\s*\}\s+from\s+['"]react-router-dom['"];?/g, 'import { useRouter } from "next/navigation";\nimport { useEffect } from "react";');
  
  // Replace Navigate component (this might be tricky, we can use a redirect component or useEffect)
  // Usually <Navigate to="/dashboard" replace /> can be replaced by a simple push in a useEffect or returning null and calling router.push
  content = content.replace(/<Navigate\s+to=(['"])(.*?)\1\s*replace\s*\/?>(<\/Navigate>)?/g, '(() => { const router = useRouter(); useEffect(() => { router.push($1$2$1); }, [router]); return null; })()');

  // Replace usage
  content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);?/g, 'const router = useRouter();');
  content = content.replace(/navigate\(/g, 'router.push(');

  content = content.replace(/const\s+location\s*=\s*useLocation\(\);?/g, 'const pathname = usePathname();');
  content = content.replace(/location\.pathname/g, 'pathname');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});
