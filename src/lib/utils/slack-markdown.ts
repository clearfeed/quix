export function formatToSlackMarkdown(text: string): string {
  return text
    // Convert bold: **text** → *text*
    .replace(/\*\*(.*?)\*\*/g, '*$1*')

    // Convert markdown links: [text](url) → <url|text>
    .replace(/\[(.*?)\]\((.*?)\)/g, '<$2|$1>')

    // Convert headings like ### Title: → *Title:*
    .replace(/^###\s*(.*?):/gm, '*$1:*')

    // Convert 'GitHub URL: https://...' → '*GitHub URL:* <https://...>'
    .replace(/^(GitHub URL|URL|Link|Location):\s*(https?:\/\/\S+)/gm, '*$1:* <$2>')

    // Convert - bullets to •
    .replace(/^\s*-\s+/gm, '• ')

    // Normalize code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => `\`\`\`\n${code.trim()}\n\`\`\``)

    // Remove unsupported markdown headers (e.g., ##, ####)
    .replace(/^#{1,6}\s*/gm, '')

    // Clean multiple newlines
    .replace(/\n{3,}/g, '\n\n');
}