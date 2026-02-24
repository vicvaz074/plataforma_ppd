"use client";

import { useLanguage } from "@/lib/LanguageContext";
import Link from "next/link";
import { motion } from "framer-motion";
import { FileText, BarChart, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleStatisticsCard } from "@/components/module-statistics-card";

export default function RATPage() {
  const { language } = useLanguage();

  const translations = {
    es: {
      title: "Inventario de Datos Personales",
      description: "Gestione el inventario de datos personales y genere informes detallados",
      registerTitle: "Registro de Inventarios",
      registerDescription: "Cree, edite y gestione inventarios de datos personales",
      reportsTitle: "Informes de Inventarios",
      reportsDescription: "Visualice estadísticas y genere informes detallados",
      goTo: "Ir a",
      hints: [
        "Crear nuevos inventarios",
        "Editar inventarios existentes",
        "Gestionar documentos asociados",
      ],
      reportHints: [
        "Visualizar estadísticas",
        "Análisis de riesgos",
        "Exportar informes (PDF, Excel)",
      ],
    },
    en: {
      title: "Personal Data Inventory",
      description: "Manage personal data inventory and generate detailed reports",
      registerTitle: "Inventory Registration",
      registerDescription: "Create, edit and manage personal data inventories",
      reportsTitle: "Inventory Reports",
      reportsDescription: "View statistics and generate detailed reports",
      goTo: "Go to",
      hints: [
        "Create new inventories",
        "Edit existing inventories",
        "Manage associated documents",
      ],
      reportHints: [
        "View statistics",
        "Risk analysis",
        "Export reports (PDF, Excel)",
      ],
    },
  } as const;

  const t = translations[language];

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2">{t.title}</h1>
        <p className="text-muted-foreground">{t.description}</p>
      </motion.div>

      <motion.div className="grid md:grid-cols-3 gap-6" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}>
          <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {t.registerTitle}
              </CardTitle>
              <CardDescription>{t.registerDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="space-y-2">
                {t.hints.map((hint, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${["bg-black", "bg-black", "bg-black"][idx]}`}></div>
                    <span className="text-sm">{hint}</span>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/rat/registro" className="flex items-center justify-between">
                  <span>{t.goTo} {t.registerTitle}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5 text-primary" />
                {t.reportsTitle}
              </CardTitle>
              <CardDescription>{t.reportsDescription}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {t.reportHints.map((hint, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${["bg-black", "bg-black", "bg-black"][idx]}`}></div>
                  <span className="text-sm">{hint}</span>
                </div>
              ))}
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full">
                <Link href="/rat/informes" className="flex items-center justify-between">
                  <span>{t.goTo} {t.reportsTitle}</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <ModuleStatisticsCard
            dataset="inventories"
            title="Estadísticas del inventario"
            description="Clasificación automática por nivel de riesgo usando inventarios capturados."
            href="/rat/informes"
            cta={`${t.goTo} ${t.reportsTitle}`}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
