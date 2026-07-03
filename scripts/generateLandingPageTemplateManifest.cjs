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

function cleanText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/&#8211;/g, '–')
    .replace(/&#8217;/g, "'")
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .trim();
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
    if (trimmed.length > 0 && trimmed.length < 120) return cleanText(trimmed);
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

function findFirstTextSnippet(value, maxLength = 120) {
  const text = findFirstText(value);
  if (!text) return null;
  return text.length <= maxLength ? text : `${text.slice(0, maxLength).trim()}…`;
}

function normalizeCategory(rawCategory) {
  return rawCategory.replace(/^\s*\d+\s*-\s*/, '').trim();
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
    const category = normalizeCategory(rawCategory) || 'Geral';
    const fileName = path.basename(relative, '.json');
    let title = fileName;
    let previewImage = null;
    let previewText = null;

    try {
      const content = fs.readFileSync(templateFile, 'utf8');
      const json = JSON.parse(content);
      if (typeof json.title === 'string' && json.title.trim().length > 0) {
        title = cleanText(json.title.trim());
      }

      const localPreviewPath = path.join(path.dirname(templateFile), `${fileName}.png`);
      if (fs.existsSync(localPreviewPath)) {
        previewImage = `/landing-templates/${path.relative(publicTemplatesDir, localPreviewPath).replace(/\\/g, '/')}`;
      } else {
        previewImage = findFirstImage(json) || null;
      }

      previewText = findFirstTextSnippet(json.content || json);
    } catch (error) {
      console.warn('Failed to parse JSON:', templateFile, error.message);
    }

    const id = kebab(`${category} ${fileName}`);
    const publicPath = `/landing-templates/${relative.replace(/\\/g, '/')}`;

    return {
      id,
      name: title,
      category,
      description: previewText || `Página com layout personalizado para conversão e apresentação visual.`,
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
  previewImage?: string | null;
  previewText?: string | null;
}

export const landingPageTemplates: LandingPageTemplate[] = ${JSON.stringify(templates, null, 2)};
`;

fs.writeFileSync(outputPath, content);
console.log(`Generated ${templates.length} landing page templates to ${outputPath}`);
