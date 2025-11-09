import { readFile } from 'fs/promises';
import * as path from 'path';
import Handlebars from 'handlebars';

export class TemplateRenderer {
  private readonly cache = new Map<string, Handlebars.TemplateDelegate>();

  constructor() {
    this.registerHelpers();
  }

  private registerHelpers(): void {
    Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
    Handlebars.registerHelper('neq', (a: any, b: any) => a !== b);
    Handlebars.registerHelper('mod', (a: number, b: number) => a % b);
    Handlebars.registerHelper('uppercase', (str: string) =>
      typeof str === 'string' ? str.toUpperCase() : ''
    );
    Handlebars.registerHelper('lowercase', (str: string) =>
      typeof str === 'string' ? str.toLowerCase() : ''
    );
    Handlebars.registerHelper('json', (context: any) =>
      JSON.stringify(context, null, 2)
    );
  }

  async render(
    templatePath: string,
    data: Record<string, any>
  ): Promise<string> {
    const fullPath = path.resolve(templatePath);

    let template = this.cache.get(fullPath);
    if (!template) {
      const content = await readFile(fullPath, 'utf-8');
      template = Handlebars.compile(content);
      this.cache.set(fullPath, template);
    }

    try {
      return template(data);
    } catch (error) {
      console.error(
        `[TemplateRendererService] Failed to render ${fullPath}:`,
        error
      );
      throw error;
    }
  }
}
