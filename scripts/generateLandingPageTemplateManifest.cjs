const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const publicTemplatesDir = path.join(root, 'public', 'landing-templates');
const outputPath = path.join(root, 'src', 'lib', 'landingPageTemplates.generated.ts');

function kebab(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normalizeCategory(rawCategory) {
  return rawCategory.replace(/^\s*\d+\s*-\s*/, '').trim();
}

function findFirstImage(value) {
  if (typeof value === 'string') {
    const candidate = value.trim();
    if (/^https?:\/\//i.test(candidate) && /\.(png|jpe?g|webp|svg)(\?|$)/i.test(candidate)) {
      return candidate;
    }
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstImage(item);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const found = findFirstImage(value[key]);
      if (found) return found;
    }
  }

  return null;
}

function findFirstText(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.length > 0 && trimmed.length < 100) return trimmed;
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstText(item);
      if (found) return found;
    }
    return null;
  }

  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      const found = findFirstText(value[key]);
      if (found) return found;
    }
  }

  return null;
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

const templateFiles = walk(publicTemplatesDir).filter((file) => !file.includes('__MACOSX'));
const templates = templateFiles
  .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
  .map((templateFile) => {
    const relative = path.relative(publicTemplatesDir, templateFile);
    const rawCategory = path.dirname(relative).split(path.sep)[0] || '';
    const category = normalizeCategory(rawCategory);
    const fileName = path.basename(relative, '.json');
    let title = fileName;
    let previewImage = null;
    let previewText = null;

    try {
      const content = fs.readFileSync(templateFile, 'utf8');
      const json = JSON.parse(content);
      if (typeof json.title === 'string' && json.title.trim().length > 0) {
        title = json.title.trim();
      }
      previewImage = findFirstImage(json);
      previewText = findFirstText(json);
    } catch (error) {
      console.warn('Failed to parse JSON:', templateFile, error.message);
    }

    const id = kebab(`${category} ${fileName}`);
    const publicPath = `/landing-templates/${relative.replace(/\\/g, '/')}`;

    return {
      id,
      name: title,
      category,
      description: `Template do tipo ${category}`,
      publicPath,
      fileName,
      previewImage,
      previewText,
    };
  });

const content = `export interface LandingPageTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  publicPath: string;
  fileName: string;
}

export const landingPageTemplates: LandingPageTemplate[] = ${JSON.stringify(templates, null, 2)};
`;

fs.writeFileSync(outputPath, content);
console.log(`Generated ${templates.length} landing page templates to ${outputPath}`);
