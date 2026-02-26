export interface MetaConfig {
  title: string;
  description: string;
  keywords?: string;
  author?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterSite?: string;
  twitterImage?: string;
}

export const defaultMeta: MetaConfig = {
  title: "AltGeo Survey Dashboard",
  description:
    "Advanced pipeline monitoring and management system for real-time infrastructure oversight",
  keywords:
    "pipeline, monitoring, SCADA, industrial, infrastructure, management, surveillance",
  author: "AltGeo Survey Dashboard Team",
  ogTitle: "AltGeo Survey Dashboard",
  ogDescription:
    "Advanced pipeline monitoring and management system for real-time infrastructure oversight",
  ogImage: "https://lovable.dev/opengraph-image-p98pqg.png",
  ogUrl: typeof window !== "undefined" ? window.location.origin : "",
  twitterCard: "summary_large_image",
  twitterSite: "@lovable_dev",
  twitterImage: "https://lovable.dev/opengraph-image-p98pqg.png",
};

export const pageMeta: Record<string, MetaConfig> = {
  home: {
    title: "AltGeo Survey Dashboard - Dashboard",
    description:
      "Real-time pipeline monitoring dashboard with device status, interactive maps, and comprehensive management tools",
    keywords:
      "pipeline dashboard, real-time monitoring, device status, interactive maps, pipeline management",
    ogTitle: "AltGeo Survey Dashboard - Dashboard",
    ogDescription:
      "Real-time pipeline monitoring dashboard with device status, interactive maps, and comprehensive management tools",
  },
  dailyMaps: {
    title: "Daily Personal Maps - AltGeo Survey Dashboard",
    description:
      "View and analyze daily survey trails from Trimble devices with comprehensive mapping and export capabilities",
    keywords:
      "daily maps, survey trails, Trimble devices, GIS, mapping, pipeline survey, data export",
    ogTitle: "Daily Personal Maps - AltGeo Survey Dashboard",
    ogDescription:
      "View and analyze daily survey trails from Trimble devices with comprehensive mapping and export capabilities",
  },
  notFound: {
    title: "Page Not Found - AltGeo Survey Dashboard",
    description:
      "The requested page could not be found. Return to the dashboard to continue monitoring your pipeline infrastructure",
    keywords: "404, page not found, pipeline monitoring",
    ogTitle: "Page Not Found - AltGeo Survey Dashboard",
    ogDescription:
      "The requested page could not be found. Return to the dashboard to continue monitoring your pipeline infrastructure",
  },
};

export const getMetaConfig = (page: keyof typeof pageMeta): MetaConfig => {
  const pageConfig = pageMeta[page];
  return {
    ...defaultMeta,
    ...pageConfig,
    ogTitle: pageConfig.ogTitle || pageConfig.title,
    ogDescription: pageConfig.ogDescription || pageConfig.description,
    twitterImage: defaultMeta.twitterImage,
    ogImage: defaultMeta.ogImage,
    ogUrl: defaultMeta.ogUrl,
  };
};
