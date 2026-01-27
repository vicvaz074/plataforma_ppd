"use client";

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSSStore } from "../lib/ss-store";

interface Props {
  onSelect: (step: number) => void;
}

const SSSectionsOverview = ({ onSelect }: Props) => {
  const state = useSSStore();
  const sections = [
    {
      step: 1,
      title: "Políticas de gestión de seguridad",
      done: state.policies.some((p) => p.type === "PGDP"),
      updated: state.policies.find((p) => p.type === "PGDP")?.lastReview,
    },
    {
      step: 2,
      title: "Funciones y obligaciones",
      done: state.evidences.some((e) => e.area === "functions"),
      updated: state.lastUpdate,
    },
    {
      step: 3,
      title: "Inventario de datos personales",
      done: !!state.inventorySummary?.hasInventory,
      updated: state.lastUpdate,
    },
    {
      step: 4,
      title: "Análisis de riesgos",
      done: !!state.riskAssessment,
      updated: state.lastUpdate,
    },
    {
      step: 5,
      title: "Medidas de seguridad",
      done: state.riskMeasures.length > 0,
      updated: state.lastUpdate,
    },
    {
      step: 6,
      title: "Implementación de medidas",
      done: state.workPlan.length > 0,
      updated: state.lastUpdate,
    },
    {
      step: 7,
      title: "Revisión y auditoría",
      done: state.audits.length > 0,
      updated: state.lastUpdate,
    },
    {
      step: 8,
      title: "Mejora continua y capacitación",
      done: state.trainings.length > 0 || state.capas.length > 0,
      updated: state.lastUpdate,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sections.map((sec) => (
        <Card key={sec.step}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{sec.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              Actualizado: {sec.updated ? new Date(sec.updated).toLocaleDateString() : "-"}
            </p>
            <p>Estatus: {sec.done ? "completo" : "pendiente"}</p>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => onSelect(sec.step)}>
              Consultar
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default SSSectionsOverview;
