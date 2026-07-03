import { landingPageTemplates as generatedLandingPageTemplates, type LandingPageTemplate as GeneratedLandingPageTemplate } from "./landingPageTemplates.generated";

export type LandingPageTemplate = GeneratedLandingPageTemplate;
export const landingPageTemplates = generatedLandingPageTemplates;

export const getLandingPageTemplate = (templateId: string) =>
  landingPageTemplates.find((template) => template.id === templateId);
