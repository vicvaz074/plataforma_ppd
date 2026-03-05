import ModuleInsightsPageClient from "./module-insights-page-client"

export function generateStaticParams() {
  return [
    { dataset: "inventories" },
    { dataset: "procedures" },
    { dataset: "dpo" },
    { dataset: "privacy-notices" },
    { dataset: "contracts" },
    { dataset: "arco" },
    { dataset: "eipd" },
    { dataset: "policies" },
    { dataset: "training" },
    { dataset: "incidents" },
  ]
}

export default function ModuleInsightsPage() {
  return <ModuleInsightsPageClient />
}