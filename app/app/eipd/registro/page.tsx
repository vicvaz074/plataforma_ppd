"use client"

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { ChevronLeft, Home, Info, PlusCircle, Save } from "lucide-react"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import QuestionItem, { QuestionAnswer } from "../components/QuestionItem"

type EipdForm = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  selectedPartA: string[]
  selectedPartB: string[]
  selectedOps?: string[]
  baseLegal: string[]
  baseLegalNotes: string
  infrastructure: string
  dataFlows: string
  assets: string
  automatedDecisions: string
  selectedThreats: string[]
  riskAssessments: Record<string, { probability: number; impact: number; justification: string }>
  controlStates: Record<
    string,
    {
      status: "implementado" | "planificado" | "no-aplica"
      evidence: string
      justification: string
      dueDate: string
    }
  >
  additionalMeasures: string
  conclusion: string
  nonSubjectJustification: string
  nextReviewDate: string
  reviewTriggers: string
  signatures: Record<
    "lider" | "dpo" | "responsable",
    { name: string; role: string; evidence: string; signedAt: string }
  >
  reviewLog: { date: string; reason: string }[]
  calendarConfirmed: boolean
  version: string
  versionHistory: { version: string; updatedAt: string }[]
  answers: Record<string, QuestionAnswer>
}

const STORAGE_KEY = "eipd_forms"

const partAOperations = [
  {
    id: "part-a-1-1",
    title:
      "¿El tratamiento implica la evaluación o puntuación de personas físicas, incluyendo la elaboración de perfiles y la predicción de aspectos específicos?",
    details:
      "Contexto: aspectos relacionados con el rendimiento en el trabajo, situación económica, salud, preferencias o intereses personales, fiabilidad, comportamiento, ubicación o movimientos del titular.",
  },
  {
    id: "part-a-1-2",
    title:
      "¿Se realiza una recogida de datos del sujeto en múltiples ámbitos de su vida que cubran varios aspectos de su personalidad o hábitos?",
    details:
      "Contexto: incluye la valoración de sujetos mediante datos combinados de su desempeño laboral, personalidad y comportamiento social.",
  },
  {
    id: "part-a-2-1",
    title:
      "¿El tratamiento implica la observación, monitorización, supervisión, geolocalización o control del titular de forma sistemática y exhaustiva?",
  },
  {
    id: "part-a-2-2",
    title: "¿Se recogen datos y metadatos a través de redes, aplicaciones o en zonas de acceso público?",
  },
  {
    id: "part-a-2-3",
    title:
      "¿Se procesan identificadores únicos que permitan rastrear a usuarios de servicios web, TV interactiva o aplicaciones móviles?",
  },
  {
    id: "part-a-2-4",
    title: "¿El tratamiento se utiliza para la observación sistemática de una zona de acceso público?",
  },
  {
    id: "part-a-3-1",
    title:
      "¿El tratamiento está destinado a tomar decisiones automatizadas que produzcan efectos jurídicos para las personas o que les afecten significativamente de modo similar?",
    details:
      "Nota: incluye cualquier decisión que impida a un titular el ejercicio de un derecho o el acceso a un bien o servicio.",
  },
  {
    id: "part-a-3-2",
    title:
      "¿La operación de tratamiento tiene como fin permitir, modificar o denegar el acceso del titular a un servicio o a la ejecución de un contrato?",
  },
  {
    id: "part-a-4-1",
    title: "¿El tratamiento involucra Datos Personales Sensibles según la LFPDPPP?",
    details:
      "Categorías: origen racial o étnico, estado de salud (presente o futuro), información genética, creencias religiosas/filosóficas/morales, opiniones políticas, preferencia sexual o antecedentes penales.",
  },
  {
    id: "part-a-4-2",
    title: "¿Se utilizan datos biométricos con el propósito de identificar de manera única a una persona física?",
  },
  {
    id: "part-a-4-3",
    title: "¿Se procesan datos genéticos para cualquier finalidad?",
  },
  {
    id: "part-a-5-1",
    title: "¿El tratamiento se considera a \"Gran Escala\" bajo los siguientes criterios?",
    details:
      "Número elevado de titulares afectados. Gran volumen o variedad de elementos de datos. Larga duración o permanencia de la actividad. Alcance geográfico extenso.",
  },
  {
    id: "part-a-5-2",
    title:
      "¿Se asocian, combinan o enlazan registros de bases de datos de dos o más tratamientos con finalidades diferentes o por responsables distintos?",
    details: "Contexto: especialmente cuando dicha combinación exceda las expectativas razonables del titular.",
  },
  {
    id: "part-a-6-1",
    title:
      "¿El tratamiento involucra datos de sujetos en situación de vulnerabilidad o donde exista un desequilibrio de poder?",
    details:
      "Ejemplos: niños, niñas y adolescentes, empleados, personas mayores, pacientes, personas con enfermedades mentales o solicitantes de asilo.",
  },
  {
    id: "part-a-6-2",
    title:
      "¿El tratamiento se realiza en un contexto donde el titular es incapaz de autorizar o denegar el tratamiento de forma libre (desequilibrio en la relación)?",
  },
  {
    id: "part-a-7-1",
    title:
      "¿El tratamiento implica el uso innovador o la aplicación de nuevas soluciones tecnológicas u organizativas?",
    details:
      "Ejemplo: combinar el uso de huella dactilar y reconocimiento facial para mejorar el control físico de acceso.",
  },
]

const partBOperations = [
  {
    id: "part-b-1",
    title:
      "¿El tratamiento ha sido informado previamente a la autoridad de control bajo un esquema de autorregulación vinculante que ya cuente con una EIPD validada e inscrita?",
  },
  {
    id: "part-b-2",
    title:
      "¿El tratamiento se realiza sin requerir el consentimiento del titular por mandato de una disposición jurídica, orden judicial o autoridad competente?",
  },
  {
    id: "part-b-3",
    title: "¿Los datos personales objeto del tratamiento se encuentran exclusivamente en fuentes de acceso público?",
  },
  {
    id: "part-b-4",
    title:
      "¿Los datos personales han sido sometidos a un procedimiento previo de disociación o anonimización irreversible?",
  },
  {
    id: "part-b-5",
    title:
      "¿El tratamiento es estrictamente indispensable para ejercer un derecho o cumplir obligaciones derivadas de una relación jurídica entre el titular y el responsable?",
  },
  {
    id: "part-b-6",
    title:
      "¿El tratamiento es indispensable para atención médica de emergencia, prevención o diagnóstico sanitario mientras el titular no pueda otorgar su consentimiento?",
  },
  {
    id: "part-b-7",
    title:
      "¿El tratamiento se limita al uso de datos de personas morales, comerciantes o profesionales con fines exclusivos de contacto comercial?",
  },
  {
    id: "part-b-8",
    title: "¿El tratamiento es realizado por un sujeto de derecho público en términos de la normatividad aplicable?",
  },
  {
    id: "part-b-9",
    title:
      "¿Se trata de un tratamiento para uso exclusivamente doméstico o personal, sin fines de divulgación o utilización comercial?",
  },
]

const baseLegalOptions = [
  "Consentimiento del titular",
  "Disposición jurídica aplicable",
  "Relación jurídica entre el titular y el responsable",
  "Datos provenientes de fuentes de acceso público",
  "Datos sometidos previamente a disociación (anonimización)",
  "Emergencia que potencialmente puede dañar a una persona en su persona o bienes",
  "Atención médica, diagnóstico o prestación de servicios sanitarios",
  "Mandato judicial o de autoridad competente",
]

const riskThreats = [
  {
    id: "threat-1",
    category: "Acceso Ilegítimo (Confidencialidad)",
    label: "Acceso no autorizado por parte de empleados (abuso de privilegios).",
  },
  {
    id: "threat-2",
    category: "Acceso Ilegítimo (Confidencialidad)",
    label: "Acceso externo (Ciberataque, Hacking, Phishing).",
  },
  {
    id: "threat-3",
    category: "Acceso Ilegítimo (Confidencialidad)",
    label: "Robo o pérdida de dispositivos con datos (Laptops, USB, Móviles).",
  },
  {
    id: "threat-4",
    category: "Acceso Ilegítimo (Confidencialidad)",
    label: "Interceptación de comunicaciones (Man-in-the-middle).",
  },
  {
    id: "threat-5",
    category: "Modificación no deseada (Integridad)",
    label: "Errores humanos en la entrada de datos.",
  },
  {
    id: "threat-6",
    category: "Modificación no deseada (Integridad)",
    label: "Alteración malintencionada de registros (Sabotaje).",
  },
  {
    id: "threat-7",
    category: "Modificación no deseada (Integridad)",
    label: "Errores de software o corrupción de bases de datos.",
  },
  {
    id: "threat-8",
    category: "Modificación no deseada (Integridad)",
    label: "Falta de control de versiones o trazabilidad de cambios.",
  },
  {
    id: "threat-9",
    category: "Desaparición o Pérdida (Disponibilidad)",
    label: "Fallo físico de infraestructura (Discos duros, Servidores).",
  },
  {
    id: "threat-10",
    category: "Desaparición o Pérdida (Disponibilidad)",
    label: "Desastres naturales (Incendio, inundación, sismo).",
  },
  {
    id: "threat-11",
    category: "Desaparición o Pérdida (Disponibilidad)",
    label: "Ataque de Ransomware (Secuestro de datos).",
  },
  {
    id: "threat-12",
    category: "Desaparición o Pérdida (Disponibilidad)",
    label: "Fallo en los sistemas de copia de seguridad (Backups corruptos).",
  },
  {
    id: "threat-13",
    category: "Otros riesgos específicos",
    label: "Re-identificación de datos seudonimizados.",
  },
  {
    id: "threat-14",
    category: "Otros riesgos específicos",
    label: "Transferencia internacional sin garantías.",
  },
]

const controlCatalog = [
  {
    id: "org-1",
    label: "[org.1] Política de seguridad aprobada",
    requirement:
      "Definir objetivos, marco legal, roles, responsabilidades y revisiones periódicas (ENS).",
    affects: "probability",
    levels: ["medio", "alto", "critico"],
  },
  {
    id: "op-acc-5",
    label: "[op.acc.5] Autenticación fuerte (biometría/tokens)",
    requirement: "Uso de MFA o biometría para accesos privilegiados.",
    affects: "probability",
    levels: ["alto", "critico"],
  },
  {
    id: "mp-if-1",
    label: "[mp.if.1] Perímetro de seguridad",
    requirement: "Segmentación y monitoreo perimetral de redes.",
    affects: "probability",
    levels: ["medio", "alto", "critico"],
  },
  {
    id: "mp-per-2",
    label: "[mp.per.2] Formación y concienciación",
    requirement: "Programas de capacitación en privacidad y seguridad.",
    affects: "probability",
    levels: ["bajo", "medio", "alto", "critico"],
  },
  {
    id: "op-exp-9",
    label: "[op.exp.9] Copias de seguridad verificadas",
    requirement: "Backups con pruebas de restauración documentadas.",
    affects: "impact",
    levels: ["medio", "alto", "critico"],
  },
  {
    id: "op-cont-3",
    label: "[op.cont.3] Plan de continuidad",
    requirement: "Plan de continuidad y recuperación ante desastres.",
    affects: "impact",
    levels: ["alto", "critico"],
  },
  {
    id: "op-mon-4",
    label: "[op.mon.4] Monitoreo y respuesta a incidentes",
    requirement: "Sistema de monitoreo y protocolos de respuesta.",
    affects: "impact",
    levels: ["medio", "alto", "critico"],
  },
]

const section2Questions = [
  "¿Cuál es el tratamiento de datos? El objetivo de esta pregunta es delimitar la operación de tratamiento que se está considerando, a la vez que se hace una primera descripción.",
  "¿Cuál es la finalidad del tratamiento? En esta pregunta debes describir la finalidad del tratamiento la cual debe ser explícita, legítima y determinada. La finalidad o las finalidades deben ser determinadas, lo cual se logra cuando con claridad, sin lugar a confusión y de manera objetiva se especifica para qué objeto serán tratados los datos personales.",
  "¿Tipos y características de los datos a tratar? En esta sección se debe especificar claramente cuáles son los tipos y las características de los datos a tratar.",
  "Fuente de los datos: especificar si los datos se han obtenido directamente del titular o de una tercera parte y, si es así, especificarla.",
  "Plazo de conservación: especificar los plazos de conservación aplicables a los datos personales y su justificación legal.",
  "Especificar si se trata algún tipo de datos sensibles. Aquí, se debe detallar el tipo de datos tratados en detalle si corresponde a alguno de estos grupos (origen racial o étnico, estado de salud presente o futuro, información genética, creencias religiosas, filosóficas y morales, opiniones políticas y preferencia sexual) o bien, se considera sensible porque su utilización indebida puede dar origen a discriminación o conllevar un riesgo grave para el titular.",
  "Uso con una finalidad diferente de la que se informó en el aviso de privacidad. Si se quieren utilizar datos con una finalidad distinta a la que se informó en el aviso de privacidad se debe informar la finalidad nueva que se persigue y por qué no es compatible con la finalidad original.",
  "¿Qué actores intervienen en el tratamiento? Se deben informar todos los actores que participen en el tratamiento. Indicar responsables del tratamiento en caso de ser más de un responsable el que se involucra en el tratamiento.",
  "Indicar encargados del tratamiento, servicio que prestarán, contrato y a qué datos accederán.",
  "Indicar el nombre de las áreas, roles y responsabilidades de los funcionarios clave que tendrán acceso a los datos personales de los titulares.",
  "¿Cuáles son los procesos de tratamiento? Los datos se pueden tratar de forma automatizada, de forma manual o con una combinación de ambas. En esta pregunta se deben informar los procesos que se aplicarán para el tratamiento y en el caso de tratamientos automatizados describir aspectos clave como si existe intervención humana en alguna fase del tratamiento, lógica del algoritmo empleado, resultados esperados y si existe posibilidad de reconsideración de la decisión.",
  "¿Dónde se hace el tratamiento de los datos? Se debe especificar el país donde se realizará el tratamiento de forma específica. En particular si se considera un país de la UE con nivel adecuado de protección se recomienda informarlo en esta sección: Andorra, Argentina, Canadá (org. comerciales), Corea del Sur, Guernsey, Isla de Man, Jersey, Islas Feroe, Japón, Nueva Zelanda, Reino Unido, Suiza y Uruguay.",
]

const section3Questions = [
  "Licitud del tratamiento: ¿Cuál es la base jurídica que legitima el tratamiento?",
  "Consentimiento del titular: ¿Se recabó de forma previa, libre, específica e informada? Adjunte evidencia.",
  "Disposición jurídica aplicable: indique el artículo, ley o reglamento que ordena el tratamiento.",
  "Relación jurídica entre el titular y el responsable: describa la relación jurídica aplicable.",
  "Datos provenientes de fuentes de acceso público: especifique la fuente y fundamento legal.",
  "Datos sometidos previamente a disociación (anonimización): describa técnica y evidencia.",
  "Emergencia que potencialmente puede dañar a una persona en su persona o bienes: explique.",
  "Atención médica, diagnóstico o prestación de servicios sanitarios: profesional responsable y justificación.",
  "Mandato judicial o de autoridad competente: describa el acto de autoridad.",
  "Principio de minimización de datos: ¿son adecuados, pertinentes y limitados a lo necesario?",
  "¿Se recogen más datos de los estrictamente necesarios?",
  "¿Podría lograrse la finalidad sin identificar a las personas (anonimización/seudonimización)?",
  "Limitación del plazo de conservación: defina plazos de retención y criterios de borrado seguro.",
  "Calidad y exactitud: ¿qué medidas garantizan datos exactos y actualizados?",
  "Transparencia y derechos: ¿cómo se informa al titular y se garantizan derechos ARCO+?",
  "Juicio de idoneidad y eficacia: relación causa-efecto del tratamiento.",
  "Indicadores o métricas para validar la eficacia.",
  "Impacto si el tratamiento no se lleva a cabo.",
  "Juicio de necesidad: ¿se exploró uso de datos anónimos o agregados?",
  "Alternativas tecnológicas menos intrusivas (seudonimización, edge, etc.).",
  "¿Por qué se considera el medio menos lesivo disponible?",
  "Minimización: ¿se limita a datos mínimos necesarios?",
  "Proporcionalidad: ¿por qué el beneficio supera el riesgo potencial?",
  "Medidas de mitigación adicionales para minimizar intrusión.",
  "¿Existe desequilibrio de poder y cómo se compensa?",
  "¿La expectativa razonable del titular coincide con la intensidad del tratamiento?",
]

const section4Questions = [
  "Amenazas: acceso no autorizado por parte de empleados (abuso de privilegios).",
  "Amenazas: acceso externo (ciberataque, hacking, phishing).",
  "Amenazas: robo o pérdida de dispositivos con datos (laptops, USB, móviles).",
  "Amenazas: interceptación de comunicaciones (man-in-the-middle).",
  "Amenazas: errores humanos en la entrada de datos.",
  "Amenazas: alteración malintencionada de registros (sabotaje).",
  "Amenazas: errores de software o corrupción de bases de datos.",
  "Amenazas: falta de control de versiones o trazabilidad de cambios.",
  "Amenazas: fallo físico de infraestructura (discos duros, servidores).",
  "Amenazas: desastres naturales (incendio, inundación, sismo).",
  "Amenazas: ataque de ransomware (secuestro de datos).",
  "Amenazas: fallo en los sistemas de copia de seguridad (backups corruptos).",
  "Amenazas: re-identificación de datos seudonimizados.",
  "Amenazas: transferencia internacional sin garantías.",
]

const section5Questions = [
  "¿A través de qué canales específicos puede el titular solicitar el acceso a la totalidad de sus datos personales tratados en este sistema?",
  "¿El sistema permite generar un reporte en formato legible y estructurado que desglose las categorías de datos, las finalidades y las transferencias realizadas?",
  "¿Cómo garantiza el tratamiento que el titular conozca el origen de sus datos cuando estos no han sido recabados directamente de él?",
  "¿Existen mecanismos automatizados o manuales para que el titular corrija sus datos cuando estos sean inexactos, incompletos o desactualizados?",
  "En caso de rectificación, ¿cómo se asegura la plataforma de notificar este cambio a los terceros o proveedores a los que se les hubieran transferido los datos previamente?",
  "¿Cuenta el tratamiento con un procedimiento de \"bloqueo\" previo a la eliminación definitiva de los datos, conforme a los periodos de prescripción legal?",
  "¿Qué medidas técnicas garantizan que, una vez ejercido el derecho de cancelación, los datos no vuelvan a ser visibles o utilizados para las finalidades del tratamiento?",
  "¿Puede el titular oponerse de manera específica al tratamiento para fines secundarios (ej. mercadotecnia) sin que esto afecte la finalidad primaria?",
  "¿Qué controles técnicos se activan cuando un titular solicita la \"limitación de uso o divulgación\" para asegurar que los datos permanezcan almacenados pero no tratados?",
  "¿Se informa al titular cuando el tratamiento incluye decisiones basadas exclusivamente en el procesamiento automatizado que produzcan efectos jurídicos o le afecten significativamente?",
  "¿Existe un mecanismo para que el titular solicite la intervención humana, exprese su punto de vista o impugne una decisión automatizada generada por el sistema?",
  "¿Es el proceso para revocar el consentimiento tan sencillo y accesible como lo fue para otorgarlo? (Explique el medio).",
  "¿Qué controles aseguran el cese inmediato del tratamiento una vez que la revocación ha sido procesada legalmente?",
  "¿El sistema registra y conserva evidencia de cada etapa de la atención a las solicitudes de derechos (recepción, análisis, respuesta y notificación)?",
  "¿Quién es la figura responsable (ej. Oficial de Protección de Datos) encargada de supervisar que las respuestas se emitan dentro de los plazos legales previstos?",
]

const section6Questions = [
  "¿Qué controles preventivos se han seleccionado para reducir la probabilidad de que las amenazas identificadas se materialicen? (Referencia a los códigos [org], [op.acc], [mp.if] de la tabla).",
  "¿Qué medidas correctivas o de recuperación se han adoptado para reducir el impacto en caso de un incidente? (Referencia a [op.cont], [op.mon], [op.exp.9]).",
  "Para cada control marcado como \"Implementado\": ¿Cuál es la evidencia documental que respalda su existencia?",
  "¿Considera que las medidas son proporcionales al volumen y sensibilidad de los datos tratados?",
]

const section7Questions = [
  "¿Quién es la persona física o cargo responsable de firmar y validar el resultado de esta evaluación?",
  "¿Se ha documentado la opinión del Delegado de Protección de Datos (DPO) o del área de Privacidad sobre las conclusiones de esta EIPD?",
  "¿Se consultó a las áreas técnicas (TI/Ciberseguridad) y de negocio para validar la viabilidad de las medidas de mitigación propuestas?",
  "En caso de haber consultado a los titulares o a sus representantes, ¿se han integrado sus comentarios o preocupaciones al informe final?",
  "¿Se encuentran vinculados y accesibles todos los documentos de soporte (Avisos de Privacidad, Contratos con terceros, Políticas de Seguridad, Análisis de Riesgos Técnicos)?",
  "¿El reporte final incluye un Resumen Ejecutivo diseñado para la alta dirección que explique el riesgo residual en términos claros de impacto organizacional?",
  "¿Desea incluir los anexos técnicos y evidencias de controles en el reporte final?",
  "¿Existen apartados en la EIPD que contengan información sensible sobre la infraestructura (vulnerabilidades) y deban ser clasificados como \"Confidenciales\" o de acceso restringido?",
  "¿Se ha verificado que la documentación guardada no contenga datos personales innecesarios para la evaluación misma (Minimización)?",
  "¿Esta EIPD está correctamente asociada al ID correspondiente en el Registro de Actividades de Tratamiento (RAT) de la organización?",
  "¿Se ha definido formalmente quién es el custodio de la versión original de esta evaluación y dónde se almacenará de forma segura?",
]

const section8Questions = [
  "¿Ha habido cambios significativos en la tecnología utilizada o en los proveedores de servicio desde la última revisión?",
  "¿Se han detectado nuevas vulnerabilidades o incidentes de seguridad relacionados con este tratamiento en el último periodo?",
  "¿Ha cambiado la base de licitud o la finalidad original por la que se recolectaron los datos?",
  "¿Se han recibido quejas o solicitudes de ejercicio de derechos ARCO que indiquen una falla en los controles implementados?",
]

const buildQuestions = (prefix: string, questions: string[]) =>
  questions.map((question, index) => ({ id: `${prefix}-${index}`, question }))

const sections = [
  {
    title: "Descripción de las operaciones de tratamiento",
    questions: buildQuestions("section-2", section2Questions),
  },
  {
    title: "Evaluación de la necesidad y proporcionalidad del tratamiento",
    questions: buildQuestions("section-3", section3Questions),
  },
  {
    title: "Evaluación de riesgos y seguridad de los datos",
    questions: buildQuestions("section-4", section4Questions),
  },
  {
    title: "Protección a los derechos de los titulares",
    questions: buildQuestions("section-5", section5Questions),
  },
  {
    title: "Medidas adoptadas para mitigar los riesgos",
    questions: buildQuestions("section-6", section6Questions),
  },
  {
    title: "Documentación de la EIPD",
    questions: buildQuestions("section-7", section7Questions),
  },
  {
    title: "Monitoreo y revisión de la EIPD",
    questions: buildQuestions("section-8", section8Questions),
  },
]

const baseAnswer: QuestionAnswer = {
  response: "no",
  status: "en-progreso",
  responsible: "",
  date: "",
  evidence: "",
  observations: "",
}

const defaultControlState = {
  status: "planificado" as const,
  evidence: "",
  justification: "",
  dueDate: "",
}

const defaultRiskAssessments = riskThreats.reduce<
  Record<string, { probability: number; impact: number; justification: string }>
>((acc, threat) => {
  acc[threat.id] = { probability: 1, impact: 1, justification: "" }
  return acc
}, {})

const defaultControlStates = controlCatalog.reduce<
  Record<
    string,
    { status: "implementado" | "planificado" | "no-aplica"; evidence: string; justification: string; dueDate: string }
  >
>((acc, control) => {
  acc[control.id] = { ...defaultControlState }
  return acc
}, {})

const defaultSignatures = {
  lider: { name: "", role: "Líder del proyecto", evidence: "", signedAt: "" },
  dpo: { name: "", role: "DPO", evidence: "", signedAt: "" },
  responsable: { name: "", role: "Responsable del tratamiento", evidence: "", signedAt: "" },
}

const responseLabels: Record<QuestionAnswer["response"], string> = {
  "": "Sin respuesta",
  si: "Sí",
  no: "No",
  parcial: "Parcial",
}

const statusLabels: Record<QuestionAnswer["status"], string> = {
  "": "Sin estado",
  cumplido: "Cumplido",
  "en-progreso": "En progreso",
  "no-aplica": "No aplica",
}

const getDefaultAnswerForSection = (questionId: string): QuestionAnswer => {
  if (questionId.startsWith("section-2") || questionId.startsWith("section-3")) {
    return {
      ...baseAnswer,
      response: "",
      status: "",
    }
  }

  return { ...baseAnswer }
}

const createDefaultAnswers = () =>
  sections.reduce<Record<string, QuestionAnswer>>((acc, section) => {
    section.questions.forEach((question) => {
      acc[question.id] = getDefaultAnswerForSection(question.id)
    })
    return acc
  }, {})

const normalizeAnswers = (answers: Record<string, QuestionAnswer>) => {
  const normalized = createDefaultAnswers()
  Object.entries(answers).forEach(([key, value]) => {
    if (Object.prototype.hasOwnProperty.call(normalized, key)) {
      normalized[key] = { ...normalized[key], ...value }
    }
  })
  return normalized
}

const formatDateTime = (value: string) => {
  if (!value) return "-"
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

const getRiskLevel = (score: number) => {
  if (score <= 2) return { label: "Riesgo Bajo", color: "🟢", level: "bajo" as const }
  if (score <= 4) return { label: "Riesgo Medio", color: "🟡", level: "medio" as const }
  if (score <= 8) return { label: "Riesgo Alto", color: "🟠", level: "alto" as const }
  return { label: "Riesgo Crítico", color: "🔴", level: "critico" as const }
}

const buildRiskAnalysis = (
  selectedThreatIds: string[],
  assessments: Record<string, { probability: number; impact: number; justification: string }>,
  controls: Record<
    string,
    { status: "implementado" | "planificado" | "no-aplica"; evidence: string; justification: string; dueDate: string }
  >,
) => {
  const selected = riskThreats.filter((threat) => selectedThreatIds.includes(threat.id))
  const implementedProbabilityControls = controlCatalog.filter(
    (control) => controls[control.id]?.status === "implementado" && control.affects === "probability",
  )
  const implementedImpactControls = controlCatalog.filter(
    (control) => controls[control.id]?.status === "implementado" && control.affects === "impact",
  )

  return selected.map((threat) => {
    const assessment = assessments[threat.id] ?? { probability: 1, impact: 1, justification: "" }
    const inherentScore = assessment.probability * assessment.impact
    const inherent = getRiskLevel(inherentScore)
    const residualProbability = Math.max(1, assessment.probability - implementedProbabilityControls.length)
    const residualImpact = Math.max(1, assessment.impact - implementedImpactControls.length)
    const residualScore = residualProbability * residualImpact
    const residual = getRiskLevel(residualScore)

    return {
      ...threat,
      assessment,
      inherentScore,
      inherent,
      residualProbability,
      residualImpact,
      residualScore,
      residual,
    }
  })
}

const collectEvidenceIndex = (
  answers: Record<string, QuestionAnswer>,
  questionIds: string[],
  controlStates: Record<
    string,
    { status: "implementado" | "planificado" | "no-aplica"; evidence: string; justification: string; dueDate: string }
  >,
) => {
  const answerEvidence = questionIds
    .map((id) => answers[id]?.evidence)
    .filter((value): value is string => Boolean(value))
  const controlEvidence = Object.values(controlStates)
    .map((control) => control.evidence)
    .filter((value): value is string => Boolean(value))

  return Array.from(new Set([...answerEvidence, ...controlEvidence]))
}

const getComplianceSummary = (answers: Record<string, QuestionAnswer>) => {
  const total = Object.values(answers).length
  const completed = Object.values(answers).filter((answer) => answer.status === "cumplido").length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)

  if (percent >= 85) return { label: "Verde", color: "🟢", percent }
  if (percent >= 60) return { label: "Ámbar", color: "🟡", percent }
  return { label: "Rojo", color: "🔴", percent }
}

const getReviewStatus = (nextReviewDate?: string) => {
  if (!nextReviewDate) return { label: "Requiere actualización", color: "🔴" }
  const today = new Date()
  const target = new Date(nextReviewDate)
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: "Vencida", color: "🔴" }
  if (diffDays <= 30) return { label: "Próxima a vencer", color: "🟡" }
  return { label: "Vigente", color: "🟢" }
}

const glossary: Record<string, string> = {
  "criterio-obligatoriedad":
    "Supuestos legales o de riesgo que hacen obligatoria una EIPD (perfilado, datos sensibles, gran escala, etc.).",
  "base-juridica":
    "Fundamento legal que permite el tratamiento (consentimiento, contrato, disposición legal, etc.).",
  "riesgo-inherente":
    "Nivel de riesgo antes de aplicar controles de mitigación.",
  "riesgo-residual":
    "Nivel de riesgo después de aplicar controles de mitigación.",
  "control-seguridad":
    "Medida técnica u organizativa para reducir probabilidad o impacto del riesgo.",
}

const getGlossaryKeyForSection = (index: number) => {
  if (index === 0) return "criterio-obligatoriedad"
  if (index === 1) return "base-juridica"
  if (index === 2) return "riesgo-inherente"
  if (index === 3) return "control-seguridad"
  return "control-seguridad"
}

const getDiagnosticResult = (partACount: number, partBCount: number) => {
  if (partACount >= 2) {
    return {
      title: "🚨 ALTO RIESGO DETECTADO.",
      description:
        "Cuantos más criterios se cumplen, mayor es la probabilidad de impacto negativo en los derechos de los titulares.",
      action: "Continúa la evaluación con prioridad y documenta medidas de mitigación.",
      variant: "destructive" as const,
    }
  }

  if (partACount >= 1) {
    return {
      title: "⚠️ EL TRATAMIENTO ESTÁ SUJETO A UNA EIPD.",
      description: "Se detectó al menos un supuesto de alto riesgo en obligatoriedad.",
      action: "Continúa con la evaluación para completar el análisis.",
      variant: "secondary" as const,
    }
  }

  if (partBCount >= 1) {
    return {
      title: "✅ TU TRATAMIENTO NO ESTÁ SUJETO A REALIZAR UNA EIPD.",
      description: "Se marcaron supuestos de no sujeción.",
      action: "Registra la justificación de no sujeción y descarga el acta correspondiente.",
      variant: "outline" as const,
    }
  }

  return {
    title: "ℹ️ RECOMENDACIÓN",
    description:
      "En casos donde la sujeción no sea clara, se recomienda realizar la EIPD. Es un instrumento práctico de Responsabilidad Proactiva.",
    action: "Puedes iniciar la EIPD para documentar el análisis preventivo.",
    variant: "secondary" as const,
  }
}

export default function EipdPage() {
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedPartA, setSelectedPartA] = useState<string[]>([])
  const [selectedPartB, setSelectedPartB] = useState<string[]>([])
  const [baseLegal, setBaseLegal] = useState<string[]>([])
  const [baseLegalNotes, setBaseLegalNotes] = useState("")
  const [infrastructure, setInfrastructure] = useState("")
  const [dataFlows, setDataFlows] = useState("")
  const [assets, setAssets] = useState("")
  const [automatedDecisions, setAutomatedDecisions] = useState("")
  const [selectedThreats, setSelectedThreats] = useState<string[]>([])
  const [riskAssessments, setRiskAssessments] =
    useState<Record<string, { probability: number; impact: number; justification: string }>>(
      defaultRiskAssessments,
    )
  const [controlStates, setControlStates] = useState<
    Record<
      string,
      { status: "implementado" | "planificado" | "no-aplica"; evidence: string; justification: string; dueDate: string }
    >
  >(defaultControlStates)
  const [additionalMeasures, setAdditionalMeasures] = useState("")
  const [conclusion, setConclusion] = useState("")
  const [nonSubjectJustification, setNonSubjectJustification] = useState("")
  const [nextReviewDate, setNextReviewDate] = useState("")
  const [reviewTriggers, setReviewTriggers] = useState("")
  const [signatures, setSignatures] = useState(defaultSignatures)
  const [reviewLog, setReviewLog] = useState<{ date: string; reason: string }[]>([])
  const [calendarConfirmed, setCalendarConfirmed] = useState(false)
  const [reviewLogReason, setReviewLogReason] = useState("")
  const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>(() => createDefaultAnswers())
  const [formName, setFormName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [forms, setForms] = useState<EipdForm[]>([])
  const [activeStep, setActiveStep] = useState(0)
  const slideRefs = useRef<Array<HTMLDivElement | null>>([])
  const [sliderHeight, setSliderHeight] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [exportMode, setExportMode] = useState<"completa" | "ejecutiva" | "publica">("completa")
  const [glossaryKey, setGlossaryKey] = useState<string | null>(null)
  const [visitedSteps, setVisitedSteps] = useState<number[]>([0])
  const [prefillId, setPrefillId] = useState("")
  const [versionInfo, setVersionInfo] = useState<{ version: string; history: { version: string; updatedAt: string }[] }>(
    { version: "v1.0", history: [] },
  )
  const editLoadRef = useRef<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return

    try {
      const parsed = JSON.parse(stored) as EipdForm[]
      setForms(parsed)
    } catch (error) {
      console.error("No se pudieron cargar los formularios EIPD", error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(forms))
  }, [forms])

  useEffect(() => {
    const mode = searchParams.get("mode")
    if (mode === "new") {
      resetDraft()
    }
  }, [searchParams])

  useEffect(() => {
    const editId = searchParams.get("editId")
    if (!editId || editLoadRef.current === editId) return
    const targetForm = forms.find((form) => form.id === editId)
    if (!targetForm) return
    editLoadRef.current = editId
    handleEdit(targetForm)
  }, [forms, searchParams])

  useEffect(() => {
    const currentSlide = slideRefs.current[activeStep]
    if (!currentSlide) return

    const updateHeight = () => {
      setSliderHeight(Math.ceil(currentSlide.getBoundingClientRect().height))
    }

    updateHeight()

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateHeight)
      return () => {
        window.removeEventListener("resize", updateHeight)
      }
    }

    const observer = new ResizeObserver(() => updateHeight())
    observer.observe(currentSlide)
    window.addEventListener("resize", updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener("resize", updateHeight)
    }
  }, [activeStep])

  const toggleSelection = (id: string, setter: Dispatch<SetStateAction<string[]>>) => {
    setter((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const togglePartASelection = (id: string) => {
    setSelectedPartA((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      if (next.length > 0) {
        setSelectedPartB([])
        setNonSubjectJustification("")
      }
      return next
    })
  }

  const togglePartBSelection = (id: string) => {
    if (selectedPartA.length > 0) return
    setSelectedPartB((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      if (next.length === 0) {
        setNonSubjectJustification("")
      }
      return next
    })
  }

  const toggleBaseLegal = (label: string) => {
    setBaseLegal((prev) => (prev.includes(label) ? prev.filter((item) => item !== label) : [...prev, label]))
  }

  const currentForm = useMemo<EipdForm>(
    () => ({
      id: editingId ?? "draft",
      name: formName.trim() || "EIPD",
      createdAt: editingId
        ? forms.find((form) => form.id === editingId)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      selectedPartA,
      selectedPartB,
      baseLegal,
      baseLegalNotes,
      infrastructure,
      dataFlows,
      assets,
      automatedDecisions,
      selectedThreats,
      riskAssessments,
      controlStates,
      additionalMeasures,
      conclusion,
      nonSubjectJustification,
      nextReviewDate,
      reviewTriggers,
      signatures,
      reviewLog,
      calendarConfirmed,
      version: versionInfo.version,
      versionHistory: versionInfo.history,
      answers,
    }),
    [
      additionalMeasures,
      answers,
      assets,
      automatedDecisions,
      baseLegal,
      baseLegalNotes,
      conclusion,
      controlStates,
      dataFlows,
      editingId,
      formName,
      forms,
      infrastructure,
      nonSubjectJustification,
      nextReviewDate,
      reviewTriggers,
      signatures,
      reviewLog,
      calendarConfirmed,
      versionInfo.version,
      versionInfo.history,
      selectedThreats,
      riskAssessments,
      selectedPartA,
      selectedPartB,
    ],
  )

  const diagnostic = useMemo(
    () => getDiagnosticResult(selectedPartA.length, selectedPartB.length),
    [selectedPartA.length, selectedPartB.length],
  )

  const riskAnalysis = useMemo(() => {
    return buildRiskAnalysis(selectedThreats, riskAssessments, controlStates)
  }, [controlStates, riskAssessments, selectedThreats])

  const highestRiskLevel = useMemo(() => {
    const maxScore = riskAnalysis.reduce((acc, threat) => Math.max(acc, threat.inherentScore), 0)
    return getRiskLevel(maxScore).level
  }, [riskAnalysis])

  const recommendedControls = useMemo(
    () => controlCatalog.filter((control) => control.levels.includes(highestRiskLevel)),
    [highestRiskLevel],
  )

  const groupedThreats = useMemo(() => {
    return riskThreats.reduce<Record<string, typeof riskThreats>>((acc, threat) => {
      acc[threat.category] = acc[threat.category] ? [...acc[threat.category], threat] : [threat]
      return acc
    }, {})
  }, [])

  const hasHighResidualRisk = useMemo(
    () => riskAnalysis.some((threat) => ["alto", "critico"].includes(threat.residual.level)),
    [riskAnalysis],
  )

  const canDownloadPdf = !hasHighResidualRisk || additionalMeasures.trim().length > 0
  const totalSteps = sections.length + 2
  const stepTitles = ["Registra el nombre de tu EIPD", "Necesidad de la EIPD", ...sections.map((section) => section.title)]
  const nameLength = formName.trim().length
  const isNameValid = nameLength > 0 && nameLength <= 80
  const formDisplayName = formName.trim() || "EIPD"
  const shouldConfirmExit = formName.trim().length > 0
  const hasSignatureNames = Object.values(signatures).every((signature) => signature.name.trim().length > 0)
  const canExportReport = canDownloadPdf && hasSignatureNames && activeStep === totalSteps - 1

  const normalizedAnswers = useMemo(() => normalizeAnswers(answers), [answers])

  const nextStep = () => {
    setActiveStep((prev) => {
      const next = Math.min(prev + 1, totalSteps - 1)
      setVisitedSteps((steps) => (steps.includes(next) ? steps : [...steps, next]))
      return next
    })
  }
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0))

  const complianceSummary = useMemo(() => getComplianceSummary(normalizedAnswers), [normalizedAnswers])
  const evidenceIndex = useMemo(() => {
    const evidenceQuestions = sections.slice(0, 5).flatMap((section) => section.questions.map((q) => q.id))
    return collectEvidenceIndex(normalizedAnswers, evidenceQuestions, controlStates)
  }, [controlStates, normalizedAnswers])

  const handleGenerateReport = (mode: "completa" | "ejecutiva" | "publica") => {
    if (selectedPartA.length > 0 && !visitedSteps.includes(2)) {
      toast({
        title: "Completa la descripción de operaciones",
        description:
          "Antes de cerrar la EIPD debes pasar por la descripción de operaciones.",
        variant: "destructive",
      })
      return false
    }
    if (!hasSignatureNames) {
      toast({
        title: "Firmas pendientes",
        description: "Registra los nombres de las firmas para habilitar el reporte final.",
        variant: "destructive",
      })
      return false
    }
    let scheduledDate = nextReviewDate
    if (!nextReviewDate) {
      const nextDate = new Date()
      nextDate.setFullYear(nextDate.getFullYear() + 1)
      scheduledDate = nextDate.toISOString().slice(0, 10)
      setNextReviewDate(scheduledDate)
      toast({
        title: "Revisión programada",
        description: "Se asignó una fecha de revisión anual automática.",
      })
    }

    setCalendarConfirmed(true)
    const newLogEntry = { date: new Date().toISOString(), reason: "Generación de informe final EIPD" }
    setReviewLog((prev) => [newLogEntry, ...prev])
    generatePdf(
      {
        ...currentForm,
        nextReviewDate: scheduledDate,
        calendarConfirmed: true,
        reviewLog: [newLogEntry, ...reviewLog],
      },
      mode,
    )
    return true
  }

  const handleClone = (form: EipdForm) => {
    const now = new Date().toISOString()
    const cloned = {
      ...form,
      id: `eipd-${Date.now()}`,
      name: `${form.name} (copia)`,
      createdAt: now,
      updatedAt: now,
      version: "v1.0",
      versionHistory: [],
    }
    setForms((prev) => [cloned, ...prev])
    handleEdit(cloned)
  }

  const resetDraft = () => {
    setEditingId(null)
    setFormName("")
    setSelectedPartA([])
    setSelectedPartB([])
    setBaseLegal([])
    setBaseLegalNotes("")
    setInfrastructure("")
    setDataFlows("")
    setAssets("")
    setAutomatedDecisions("")
    setSelectedThreats([])
    setRiskAssessments(defaultRiskAssessments)
    setControlStates(defaultControlStates)
    setAdditionalMeasures("")
    setConclusion("")
    setNonSubjectJustification("")
    setNextReviewDate("")
    setReviewTriggers("")
    setSignatures(defaultSignatures)
    setReviewLog([])
    setCalendarConfirmed(false)
    setReviewLogReason("")
    setAnswers(createDefaultAnswers())
    setActiveStep(0)
    setVisitedSteps([0])
    setVersionInfo({ version: "v1.0", history: [] })
  }

  const persistForm = (options?: { resetAfterSave?: boolean }) => {
    if (!formName.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Asigna un nombre para registrar el formulario.",
        variant: "destructive",
      })
      return null
    }

    const now = new Date().toISOString()
    const existing = forms.find((form) => form.id === editingId)
    const nextVersionNumber = existing
      ? Number(existing.version?.replace("v", "")) + 0.1
      : 1.0
    const versionString = `v${nextVersionNumber.toFixed(1)}`
    const versionHistory = existing?.versionHistory ?? []
    const updatedHistory = existing
      ? [{ version: existing.version || "v1.0", updatedAt: existing.updatedAt }, ...versionHistory]
      : versionHistory
    const cleanedAnswers = normalizeAnswers(answers)
    const formToSave: EipdForm = {
      id: editingId ?? `eipd-${Date.now()}`,
      name: formName.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      selectedPartA,
      selectedPartB,
      baseLegal,
      baseLegalNotes,
      infrastructure,
      dataFlows,
      assets,
      automatedDecisions,
      selectedThreats,
      riskAssessments,
      controlStates,
      additionalMeasures,
      conclusion,
      nonSubjectJustification,
      nextReviewDate,
      reviewTriggers,
      signatures,
      reviewLog,
      calendarConfirmed,
      version: versionString,
      versionHistory: updatedHistory,
      answers: cleanedAnswers,
    }

    setVersionInfo({ version: versionString, history: updatedHistory })

    setForms((prev) => {
      if (editingId) {
        return prev.map((form) => (form.id === editingId ? formToSave : form))
      }
      return [formToSave, ...prev]
    })

    toast({
      title: editingId ? "Formulario actualizado" : "Formulario guardado",
      description: "Se registraron los datos de la EIPD.",
    })
    if (options?.resetAfterSave !== false) {
      resetDraft()
    } else {
      setEditingId(formToSave.id)
      setAnswers(cleanedAnswers)
    }
    return formToSave
  }

  const handleSave = () => {
    persistForm()
  }

  const handleCreateAndContinue = () => {
    const saved = persistForm({ resetAfterSave: false })
    if (!saved) return
    setActiveStep(1)
    setVisitedSteps((steps) => (steps.includes(1) ? steps : [...steps, 1]))
  }

  const handleSaveAndExit = () => {
    const saved = persistForm()
    if (!saved) return
    router.push("/eipd")
  }

  const handleCancel = () => {
    if (shouldConfirmExit && !window.confirm("¿Quieres salir sin guardar?")) return
    router.push("/eipd")
  }

  const handlePrefill = () => {
    if (!prefillId) return
    const baseForm = forms.find((form) => form.id === prefillId)
    if (!baseForm) return
    handleClone(baseForm)
    setPrefillId("")
  }

  const handleEdit = (form: EipdForm) => {
    const mergedAnswers = normalizeAnswers(form.answers ?? {})

    setEditingId(form.id)
    setFormName(form.name)
    setSelectedPartA(form.selectedPartA ?? form.selectedOps ?? [])
    setSelectedPartB(form.selectedPartB ?? [])
    setBaseLegal(form.baseLegal ?? [])
    setBaseLegalNotes(form.baseLegalNotes ?? "")
    setInfrastructure(form.infrastructure ?? "")
    setDataFlows(form.dataFlows ?? "")
    setAssets(form.assets ?? "")
    setAutomatedDecisions(form.automatedDecisions ?? "")
    setSelectedThreats(form.selectedThreats ?? [])
    setRiskAssessments({ ...defaultRiskAssessments, ...(form.riskAssessments ?? {}) })
    setControlStates({ ...defaultControlStates, ...(form.controlStates ?? {}) })
    setAdditionalMeasures(form.additionalMeasures ?? "")
    setConclusion(form.conclusion ?? "")
    setNonSubjectJustification(form.nonSubjectJustification ?? "")
    setNextReviewDate(form.nextReviewDate ?? "")
    setReviewTriggers(form.reviewTriggers ?? "")
    setSignatures(form.signatures ?? defaultSignatures)
    setReviewLog(form.reviewLog ?? [])
    setCalendarConfirmed(form.calendarConfirmed ?? false)
    setReviewLogReason("")
    setAnswers(mergedAnswers)
    setActiveStep(0)
    setVisitedSteps([0])
    setVersionInfo({
      version: form.version ?? "v1.0",
      history: form.versionHistory ?? [],
    })

    toast({
      title: "Edición activa",
      description: "Puedes actualizar la información y volver a guardar.",
    })
  }

  const generateExemptionPdf = (form: EipdForm) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" })

    doc.setFontSize(18)
    doc.text("Acta de Exención EIPD", 40, 48)
    doc.setFontSize(12)
    doc.text(`Formulario: ${form.name}`, 40, 72)
    doc.text(`Actualizado: ${formatDateTime(form.updatedAt)}`, 40, 92)

    const selectedPartBOperations = (form.selectedPartB ?? [])
      .map((id) => partBOperations.find((op) => op.id === id))
      .filter(Boolean) as typeof partBOperations
    const diagnostic = getDiagnosticResult(form.selectedPartA.length, form.selectedPartB.length)

    autoTable(doc, {
      startY: 120,
      head: [["Supuestos de no sujeción aplicados", "Observaciones"]],
      body:
        selectedPartBOperations.length > 0
          ? selectedPartBOperations.map((op) => [op.title, form.nonSubjectJustification || "-"])
          : [["Sin criterios seleccionados", ""]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 260 } },
    })

    const lastAutoTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    const diagnosticStartY = lastAutoTable ? lastAutoTable.finalY + 20 : 200
    autoTable(doc, {
      startY: diagnosticStartY,
      head: [["Resultado del diagnóstico", "Acción recomendada"]],
      body: [[`${diagnostic.title} ${diagnostic.description}`, diagnostic.action]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 260 } },
    })

    doc.save(`${form.name.replace(/\s+/g, "_")}_Exencion_EIPD.pdf`)
  }

  const generatePdf = (form: EipdForm, mode: "completa" | "ejecutiva" | "publica") => {
    const normalizedFormAnswers = normalizeAnswers(form.answers ?? {})
    const formRiskAnalysis = buildRiskAnalysis(
      form.selectedThreats ?? [],
      form.riskAssessments ?? {},
      form.controlStates ?? {},
    )
    const formHasHighResidualRisk = formRiskAnalysis.some((threat) =>
      ["alto", "critico"].includes(threat.residual.level),
    )
    const formCanDownload = !formHasHighResidualRisk || (form.additionalMeasures ?? "").trim().length > 0

    if (!formCanDownload) {
      toast({
        title: "Riesgo residual alto",
        description:
          "Debes registrar medidas de mitigación adicionales antes de descargar el reporte final.",
        variant: "destructive",
      })
      return
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" })
    const tocEntries: { title: string; page: number }[] = []
    const compliance = getComplianceSummary(normalizedFormAnswers)
    const folio = `${form.id}-${new Date(form.updatedAt).getTime()}`
    const watermarkText =
      mode === "publica" ? "VERSIÓN PÚBLICA" : mode === "completa" ? "CONFIDENCIAL" : "VERSIÓN FINAL"

    doc.setFontSize(18)
    doc.text("Evaluación de Impacto de Datos Personales", 40, 48)
    doc.setFontSize(12)
    doc.text(`Formulario: ${form.name}`, 40, 72)
    doc.text(`Actualizado: ${formatDateTime(form.updatedAt)}`, 40, 92)
    doc.text(`Folio: ${folio}`, 40, 112)
    doc.text(
      `Versión: ${mode === "completa" ? "Completa" : mode === "ejecutiva" ? "Ejecutiva" : "Pública"}`,
      40,
      132,
    )
    doc.text(`Control de versión: ${form.version}`, 40, 152)

    autoTable(doc, {
      startY: 170,
      head: [["Resumen de cumplimiento (Semáforo)", "Detalle"]],
      body: [[`${compliance.color} ${compliance.label}`, `${compliance.percent}% de cumplimiento`]],
      styles: { fontSize: 10, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 320 } },
    })

    doc.text("Índice", 40, 260)
    doc.text("Los enlaces llevan a cada sección dentro del reporte.", 40, 278)

    doc.addPage()

    const selectedPartAOperations = (form.selectedPartA ?? form.selectedOps ?? [])
      .map((id) => partAOperations.find((op) => op.id === id))
      .filter(Boolean) as typeof partAOperations
    const selectedPartBOperations = (form.selectedPartB ?? [])
      .map((id) => partBOperations.find((op) => op.id === id))
      .filter(Boolean) as typeof partBOperations
    const diagnostic = getDiagnosticResult(
      selectedPartAOperations.length,
      selectedPartBOperations.length,
    )
    const getPageCount = () =>
      typeof doc.getNumberOfPages === "function" ? doc.getNumberOfPages() : doc.internal.pages.length - 1

    tocEntries.push({ title: "Diagnóstico de necesidad", page: getPageCount() })
    autoTable(doc, {
      startY: 110,
      head: [["Supuestos de obligatoriedad", "Contexto"]],
      body:
        selectedPartAOperations.length > 0
          ? selectedPartAOperations.map((op) => [op.title, op.details ?? "-"])
          : [["Sin criterios seleccionados", ""]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [30, 41, 59], textColor: 255 },
      columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 320 } },
    })

    const lastAutoTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    const partBStartY = lastAutoTable ? lastAutoTable.finalY + 20 : 160
    autoTable(doc, {
      startY: partBStartY,
      head: [["Supuestos de no sujeción", "Observaciones"]],
      body:
        selectedPartBOperations.length > 0
          ? selectedPartBOperations.map((op) => [op.title, form.nonSubjectJustification || "-"])
          : [["Sin criterios seleccionados", ""]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [51, 65, 85], textColor: 255 },
      columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 260 } },
    })

    const diagnosticTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
    const diagnosticStartY = diagnosticTable ? diagnosticTable.finalY + 20 : 200
    autoTable(doc, {
      startY: diagnosticStartY,
      head: [["Resultado del diagnóstico", "Acción del sistema"]],
      body: [[`${diagnostic.title} ${diagnostic.description}`, diagnostic.action]],
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: { 0: { cellWidth: 260 }, 1: { cellWidth: 260 } },
    })

    if (mode !== "publica") {
      tocEntries.push({ title: sections[0].title, page: getPageCount() })
      autoTable(doc, {
        startY: diagnosticStartY + 90,
        head: [["Datos estructurados adicionales", "Detalle"]],
        body: [
          ["Infraestructura tecnológica", form.infrastructure || "-"],
          ["Flujos de datos", form.dataFlows || "-"],
          ["Activos críticos", form.assets || "-"],
          ["Decisiones automatizadas", form.automatedDecisions || "-"],
          ["Bases legales seleccionadas", form.baseLegal.length ? form.baseLegal.join(", ") : "-"],
          ["Notas sobre base legal", form.baseLegalNotes || "-"],
        ],
        styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 350 } },
        margin: { left: 30, right: 30 },
      })
    }

    const riskStartY =
      ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140) + 20
    tocEntries.push({ title: sections[2].title, page: getPageCount() })
    const riskHead =
      mode === "completa"
        ? [["Amenaza", "P", "I", "Riesgo inherente", "Residual", "Justificación"]]
        : [["Riesgo clave", "Riesgo inherente", "Riesgo residual"]]
    const riskBody =
      mode === "completa"
        ? formRiskAnalysis.length > 0
          ? formRiskAnalysis.map((risk) => [
              `${risk.category} - ${risk.label}`,
              `${risk.assessment.probability}`,
              `${risk.assessment.impact}`,
              `${risk.inherent.color} ${risk.inherent.label}`,
              `${risk.residual.color} ${risk.residual.label}`,
              risk.assessment.justification || "-",
            ])
          : [["Sin amenazas seleccionadas", "-", "-", "-", "-", "-"]]
        : formRiskAnalysis.length > 0
          ? formRiskAnalysis.map((risk) => [
              `${risk.category}`,
              `${risk.inherent.color} ${risk.inherent.label}`,
              `${risk.residual.color} ${risk.residual.label}`,
            ])
          : [["Sin riesgos evaluados", "-", "-"]]
    autoTable(doc, {
      startY: riskStartY,
      head: riskHead,
      body: riskBody,
      styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      margin: { left: 30, right: 30 },
    })

    const controlsStartY =
      ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200) + 20
    if (mode === "completa") {
      tocEntries.push({ title: sections[4].title, page: getPageCount() })
      autoTable(doc, {
        startY: controlsStartY,
        head: [["Control", "Estado", "Evidencia", "Justificación/Fecha"]],
        body: controlCatalog.map((control) => {
          const state = form.controlStates[control.id] ?? defaultControlState
          const detail =
            state.status === "planificado"
              ? `Planificado para ${state.dueDate || "-"}`
              : state.status === "no-aplica"
                ? state.justification || "-"
                : "-"
          return [control.label, state.status, state.evidence || "-", detail]
        }),
        styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [51, 65, 85], textColor: 255 },
        margin: { left: 30, right: 30 },
      })
    }

    const conclusionStartY =
      ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200) + 20
    tocEntries.push({ title: "Conclusiones y monitoreo", page: getPageCount() })
    autoTable(doc, {
      startY: conclusionStartY,
      head: [["Conclusión y monitoreo", "Detalle"]],
      body: [
        ["Conclusión final", form.conclusion || "-"],
        ["Medidas adicionales", form.additionalMeasures || "-"],
        ["Próxima revisión", form.nextReviewDate || "-"],
        ["Disparadores de revisión", form.reviewTriggers || "-"],
        [
          "Log de cambios",
          form.reviewLog?.length
            ? form.reviewLog
                .slice(0, 3)
                .map((entry) => `${new Date(entry.date).toLocaleDateString("es-MX")}: ${entry.reason}`)
                .join(" | ")
            : "-",
        ],
      ],
      styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
      headStyles: { fillColor: [15, 23, 42], textColor: 255 },
      columnStyles: { 0: { cellWidth: 170 }, 1: { cellWidth: 350 } },
      margin: { left: 30, right: 30 },
    })

    if (mode === "completa") {
      const evidenceQuestions = sections.slice(0, 5).flatMap((section) => section.questions.map((q) => q.id))
      const evidenceIndex = collectEvidenceIndex(normalizedFormAnswers, evidenceQuestions, form.controlStates)
      tocEntries.push({ title: "Anexos y evidencias", page: getPageCount() })
      autoTable(doc, {
        startY:
          ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200) + 20,
        head: [["Índice de evidencias", "Archivo"]],
        body:
          evidenceIndex.length > 0
            ? evidenceIndex.map((evidence) => ["Evidencia cargada", evidence])
            : [["Sin evidencias adjuntas", "-"]],
        styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        margin: { left: 30, right: 30 },
      })

      const annexPage = doc.getNumberOfPages()
      let evidenceY =
        ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200) + 20
      doc.setFontSize(9)
      evidenceIndex.forEach((evidence) => {
        if (evidenceY > 760) {
          doc.addPage()
          evidenceY = 60
        }
        doc.textWithLink(`• ${evidence}`, 50, evidenceY, { pageNumber: annexPage })
        evidenceY += 14
      })
    }

    if (mode !== "publica") {
      tocEntries.push({ title: "Firmas multidisciplinarias", page: getPageCount() })
      const signaturesStartY =
        ((doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200) + 20
      autoTable(doc, {
        startY: signaturesStartY,
        head: [["Firma", "Nombre", "Evidencia", "Fecha"]],
        body: Object.values(form.signatures ?? defaultSignatures).map((signature) => [
          signature.role,
          signature.name || "-",
          signature.evidence || "-",
          signature.signedAt ? formatDateTime(signature.signedAt) : "-",
        ]),
        styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        margin: { left: 30, right: 30 },
      })
    }

    if (mode === "completa") {
      sections.forEach((section) => {
        tocEntries.push({ title: section.title, page: getPageCount() })
        const lastSectionTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
        const tableStartY = lastSectionTable ? lastSectionTable.finalY + 24 : 140
        autoTable(doc, {
          startY: tableStartY,
          head: [[section.title, "Respuesta", "Estado", "Responsable", "Fecha", "Evidencia", "Observaciones"]],
          body: section.questions.map((question) => {
            const answer = normalizedFormAnswers[question.id] ?? baseAnswer
            return [
              question.question,
              responseLabels[answer.response],
              statusLabels[answer.status],
              answer.responsible || "-",
              answer.date || "-",
              answer.evidence || "-",
              answer.observations || "-",
            ]
          }),
          styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 9 },
          columnStyles: {
            0: { cellWidth: 170 },
            1: { cellWidth: 55 },
            2: { cellWidth: 65 },
            3: { cellWidth: 70 },
            4: { cellWidth: 60 },
            5: { cellWidth: 60 },
            6: { cellWidth: 100 },
          },
          margin: { left: 30, right: 30 },
        })
      })
    }

    const totalPages = getPageCount()
    for (let page = 1; page <= totalPages; page += 1) {
      doc.setPage(page)
      doc.setFontSize(9)
      doc.setTextColor(100)
      doc.text(`Folio: ${folio}`, 40, 28)
      doc.text(`Página ${page} de ${totalPages}`, 480, 28)
      doc.setTextColor(200)
      doc.setFontSize(40)
      doc.text(watermarkText, 80, 420, { angle: 45 })
      doc.setTextColor(0)
      doc.setFontSize(12)
    }

    doc.setPage(1)
    doc.setFontSize(12)
    let tocY = 300
    tocEntries.forEach((entry) => {
      if (tocY > 760) {
        doc.addPage()
        tocY = 60
      }
      doc.textWithLink(`${entry.title} ..... ${entry.page}`, 40, tocY, { pageNumber: entry.page })
      tocY += 18
    })

    doc.save(`${form.name.replace(/\s+/g, "_")}_EIPD.pdf`)
  }

  const generateDocx = (form: EipdForm, mode: "completa" | "ejecutiva" | "publica") => {
    const normalizedFormAnswers = normalizeAnswers(form.answers ?? {})
    const compliance = getComplianceSummary(normalizedFormAnswers)
    const lines = [
      `Evaluación de Impacto de Datos Personales`,
      `Formulario: ${form.name}`,
      `Versión: ${mode}`,
      `Actualizado: ${formatDateTime(form.updatedAt)}`,
      `Folio: ${form.id}`,
      `Semáforo de cumplimiento: ${compliance.label} (${compliance.percent}%)`,
      ``,
      `Conclusión: ${form.conclusion || "-"}`,
      `Medidas adicionales: ${form.additionalMeasures || "-"}`,
      `Próxima revisión: ${form.nextReviewDate || "-"}`,
      ``,
      `Índice de evidencias:`,
      ...collectEvidenceIndex(
        normalizedFormAnswers,
        sections.slice(0, 5).flatMap((s) => s.questions.map((q) => q.id)),
        form.controlStates,
      ).map((evidence) => `- ${evidence}`),
    ]

    const blob = new Blob([lines.join("\n")], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${form.name.replace(/\s+/g, "_")}_EIPD.docx`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 overflow-x-hidden px-4 py-10">
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/eipd">
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      {activeStep >= 1 && (
        <div className="relative">
          <div className="h-[120px]" aria-hidden="true" />
          <div className="fixed top-16 right-0 z-40 sm:left-64 lg:left-72">
            <div className="mx-auto w-full max-w-6xl px-4">
              <div className="rounded-xl border bg-white/90 p-4 shadow-sm backdrop-blur dark:bg-slate-950/80">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground">Barra de progreso general</p>
                    <p className="text-lg font-semibold text-foreground">
                      Fase {activeStep + 1} de {totalSteps} · {stepTitles[activeStep]}
                    </p>
                    <p className="text-sm text-muted-foreground">EIPD en edición: {formDisplayName}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Avance: {Math.round(((activeStep + 1) / totalSteps) * 100)}%
                  </p>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${((activeStep + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <Card className="overflow-hidden border-0 bg-gradient-to-br from-slate-50 via-white to-slate-100 shadow-lg dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <CardContent className="p-5 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1 space-y-4">
              <Badge variant="secondary" className="w-fit">
                Evaluación EIPD
              </Badge>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Registro de Evaluación de Impacto en Protección de Datos
              </h1>
              <p className="text-sm text-muted-foreground sm:text-base">
                Consolida las respuestas, evidencias y decisiones para documentar el impacto del tratamiento de datos
                personales. Guarda varios formularios, genera reportes finales al cierre y conserva un historial auditable.
              </p>
              <p className="text-sm text-muted-foreground sm:text-base">
                El módulo EIPD ayuda a identificar, analizar y mitigar riesgos del tratamiento de datos personales,
                fortaleciendo el cumplimiento proactivo, la privacidad desde el diseño y por defecto, y la rendición de
                cuentas ante titulares y autoridades.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedPartA.length} criterios de obligatoriedad</Badge>
                <Badge variant="outline">{selectedPartB.length} criterios de no sujeción</Badge>
                <Badge variant="outline">{forms.length} formularios registrados</Badge>
                <Badge variant="outline">Versión {versionInfo.version}</Badge>
              </div>
            </div>
            <div className="w-full max-w-md space-y-4 rounded-2xl border bg-white/80 p-5 shadow-sm dark:bg-slate-950/60">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-muted-foreground">EIPD en edición</p>
                <p className="text-xl font-semibold text-foreground">{formDisplayName}</p>
                <p className="text-xs text-muted-foreground">
                  Edita el nombre en el paso 1 si necesitas actualizarlo.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button className="gap-2" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                  Guardar avance
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => setActiveStep(0)}>
                  Editar nombre
                </Button>
                <Button variant="ghost" className="gap-2" onClick={resetDraft}>
                  <PlusCircle className="h-4 w-4" />
                  Nuevo
                </Button>
              </div>
              {editingId && (
                <p className="text-xs text-muted-foreground">
                  Editando formulario guardado. Guarda para conservar los cambios.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-4">
            <div className="space-y-1 pt-2">
              <p className="text-sm font-semibold text-muted-foreground">Progreso</p>
              <p className="text-lg font-semibold text-foreground">
                Paso {activeStep + 1} de {totalSteps}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={prevStep} disabled={activeStep === 0}>
                Anterior
              </Button>
              <Button
                onClick={nextStep}
                disabled={activeStep === totalSteps - 1 || (activeStep === 0 && !isNameValid)}
              >
                Siguiente
              </Button>
            </div>
          </div>
          <div
            className="relative w-full overflow-hidden transition-[height] duration-500 ease-in-out"
            style={{ height: sliderHeight ? `${sliderHeight}px` : "auto" }}
          >
            <div
              className="flex w-full items-start transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${activeStep * 100}%)` }}
            >
              <div ref={(el) => { slideRefs.current[0] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Registra el nombre de tu EIPD</CardTitle>
                    <CardDescription>
                      Asigna un nombre claro para identificar esta Evaluación de Impacto en Protección de Datos. Podrás
                      editarlo después.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">
                        Nombre de la EIPD <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={formName}
                        maxLength={80}
                        onChange={(event) => setFormName(event.target.value)}
                        placeholder="Ej. EIPD – Chatbot Atención a Clientes – 2026"
                      />
                      <div className="text-xs text-muted-foreground">
                        <p>Usa un nombre único y descriptivo (proyecto + área + año).</p>
                        <p>Evita abreviaturas internas no conocidas.</p>
                        <p>Recomendación: 8–80 caracteres.</p>
                      </div>
                      {nameLength > 0 && nameLength < 8 && (
                        <p className="text-xs text-amber-600">El nombre es válido, pero se recomienda más detalle.</p>
                      )}
                    </div>

                    {forms.length > 0 && (
                      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-4">
                        <p className="text-sm font-semibold text-foreground">¿Quieres prellenar con otra EIPD?</p>
                        <p className="text-xs text-muted-foreground">
                          Puedes reutilizar información existente como base para acelerar el registro.
                        </p>
                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-end">
                          <div>
                            <Label className="text-xs text-muted-foreground">EIPD base</Label>
                            <Select value={prefillId} onValueChange={setPrefillId}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Selecciona una EIPD guardada" />
                              </SelectTrigger>
                              <SelectContent>
                                {forms.map((form) => (
                                  <SelectItem key={form.id} value={form.id}>
                                    {form.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button variant="outline" onClick={handlePrefill} disabled={!prefillId}>
                            Usar como base
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleCreateAndContinue} disabled={!isNameValid}>
                        Crear EIPD y continuar
                      </Button>
                      <Button variant="secondary" onClick={handleSaveAndExit} disabled={!isNameValid}>
                        Guardar y salir
                      </Button>
                      <Button variant="ghost" onClick={handleCancel}>
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

              </div>

              <div ref={(el) => { slideRefs.current[1] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Necesidad de la EIPD</CardTitle>
                    <CardDescription>
                      Esta sección actúa como un filtro normativo inicial para determinar la obligatoriedad de realizar
                      una EIPD. Analiza criterios de riesgo y supuestos legales para validar si el tratamiento requiere
                      este nivel de análisis o se encuentra exento conforme a la normativa vigente.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 text-sm text-muted-foreground">
                    <div>
                      <p className="font-semibold text-foreground">Tips para el uso de esta sección</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>No asuma, valide: complete este módulo para generar evidencia de no obligatoriedad.</li>
                        <li>
                          Criterios combinados: la combinación de factores (ej. geolocalización + datos de menores) puede
                          activar la necesidad de la EIPD.
                        </li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Instrucciones</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-5">
                        <li>Analice cuidadosamente el flujo de datos diseñado en su proyecto.</li>
                        <li>Contraste su actividad con la lista de supuestos presentados.</li>
                        <li>En caso de duda, elija la opción que favorezca la mayor protección del titular.</li>
                        <li>
                          Si el sistema determina que no es necesaria una EIPD, descargue y archive el reporte como
                          justificante legal.
                        </li>
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Supuestos de obligatoriedad (alto riesgo)</CardTitle>
                    <CardDescription>
                      Marque los supuestos de alto riesgo que apliquen al tratamiento propuesto.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Accordion type="multiple" className="space-y-2">
                      <AccordionItem value="subtema-1-1">
                        <AccordionTrigger className="text-sm font-semibold">
                          Perfilado, evaluación y análisis predictivo
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partAOperations.slice(0, 2).map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartA.includes(op.id)}
                                onCheckedChange={() => togglePartASelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                {op.details && <p className="text-sm text-muted-foreground">{op.details}</p>}
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                          {selectedPartA.includes("part-a-1-1") && (
                            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs text-muted-foreground">
                              Criterio de obligatoriedad detectado. Puede seguir completando el cuestionario para un
                              análisis más robusto o saltar a la siguiente sección.
                              <div className="mt-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setActiveStep(2)
                                    setVisitedSteps((steps) => (steps.includes(2) ? steps : [...steps, 2]))
                                  }}
                                >
                                  Saltar a descripción de operaciones
                                </Button>
                              </div>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="subtema-1-2">
                        <AccordionTrigger className="text-sm font-semibold">
                          Observación, monitoreo y geolocalización
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partAOperations.slice(2, 6).map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartA.includes(op.id)}
                                onCheckedChange={() => togglePartASelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                {op.details && <p className="text-sm text-muted-foreground">{op.details}</p>}
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="subtema-1-3">
                        <AccordionTrigger className="text-sm font-semibold">
                          Decisiones automatizadas y limitación de derechos
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partAOperations.slice(6, 8).map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartA.includes(op.id)}
                                onCheckedChange={() => togglePartASelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                {op.details && <p className="text-sm text-muted-foreground">{op.details}</p>}
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="subtema-1-4">
                        <AccordionTrigger className="text-sm font-semibold">
                          Datos personales sensibles
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partAOperations.slice(8, 11).map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartA.includes(op.id)}
                                onCheckedChange={() => togglePartASelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                {op.details && <p className="text-sm text-muted-foreground">{op.details}</p>}
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="subtema-1-5">
                        <AccordionTrigger className="text-sm font-semibold">
                          Tratamiento a gran escala y asociación de datos
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partAOperations.slice(11, 13).map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartA.includes(op.id)}
                                onCheckedChange={() => togglePartASelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                {op.details && <p className="text-sm text-muted-foreground">{op.details}</p>}
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="subtema-1-6">
                        <AccordionTrigger className="text-sm font-semibold">Población vulnerable o desequilibrio de poder</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partAOperations.slice(13, 15).map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartA.includes(op.id)}
                                onCheckedChange={() => togglePartASelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                {op.details && <p className="text-sm text-muted-foreground">{op.details}</p>}
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="subtema-1-7">
                        <AccordionTrigger className="text-sm font-semibold">Innovación tecnológica y nuevas soluciones</AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partAOperations.slice(15).map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartA.includes(op.id)}
                                onCheckedChange={() => togglePartASelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                {op.details && <p className="text-sm text-muted-foreground">{op.details}</p>}
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Supuestos de no sujeción (excepciones)</CardTitle>
                    <CardDescription>Marque solo si no ha seleccionado ningún supuesto de obligatoriedad.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Accordion type="multiple">
                      <AccordionItem value="subtema-1-8">
                        <AccordionTrigger className="text-sm font-semibold">
                          Supuestos de no sujeción
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4">
                          {partBOperations.map((op) => (
                            <div
                              key={op.id}
                              className="flex items-start space-x-3 rounded-xl border border-muted/50 bg-white/80 p-4 shadow-sm dark:bg-muted/10"
                            >
                              <Checkbox
                                id={op.id}
                                checked={selectedPartB.includes(op.id)}
                                disabled={selectedPartA.length > 0}
                                onCheckedChange={() => togglePartBSelection(op.id)}
                              />
                              <div className="space-y-1">
                                <label htmlFor={op.id} className="font-medium leading-none text-foreground">
                                  {op.title}
                                </label>
                                <button
                                  type="button"
                                  className="flex items-center gap-1 text-xs text-muted-foreground"
                                  onClick={() => setGlossaryKey("criterio-obligatoriedad")}
                                >
                                  <Info className="h-3 w-3" /> Glosario
                                </button>
                              </div>
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    {selectedPartA.length > 0 && (
                      <p className="text-xs text-destructive">
                        Los supuestos de no sujeción se habilitan únicamente cuando no hay selecciones de obligatoriedad.
                      </p>
                    )}
                    {selectedPartB.length > 0 && selectedPartA.length === 0 && (
                      <div className="rounded-lg border border-muted/50 p-4">
                        <Label className="text-sm font-semibold text-foreground">
                          Justificación de no sujeción <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          className="mt-2"
                          value={nonSubjectJustification}
                          onChange={(event) => setNonSubjectJustification(event.target.value)}
                          placeholder="Explica por qué el tratamiento no está sujeto a realizar EIPD."
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Resultado del diagnóstico</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Badge variant={diagnostic.variant} className="w-fit">
                      {diagnostic.title}
                    </Badge>
                    <p className="text-sm text-muted-foreground">{diagnostic.description}</p>
                    <p className="text-sm font-medium text-foreground">{diagnostic.action}</p>
                    {selectedPartB.length > 0 && selectedPartA.length === 0 && (
                      <Button
                        variant="outline"
                        onClick={() => generateExemptionPdf(currentForm)}
                        disabled={!nonSubjectJustification.trim()}
                      >
                        Descargar Justificación de No Sujeción
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div ref={(el) => { slideRefs.current[2] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{sections[0].title}</CardTitle>
                    <CardDescription>
                      Esta sección constituye el cimiento técnico de la EIPD. Su objetivo es realizar un mapeo
                      exhaustivo y detallado del ciclo de vida de los datos personales, desde su captación inicial
                      hasta su supresión definitiva. A través de este módulo, se definen los flujos de datos, la
                      infraestructura tecnológica, los actores involucrados (responsables y encargados) y las
                      finalidades específicas, proporcionando la visibilidad necesaria para que el posterior análisis
                      de riesgos sea preciso y contextualizado.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4 text-sm text-muted-foreground">
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">Recomendaciones</p>
                        <ol className="list-decimal space-y-1 pl-5">
                          <li>
                            Es esencial que facilites una descripción sistemática del tratamiento, para conocer los
                            riesgos potenciales que este implica, describe el tratamiento de forma detallada.
                          </li>
                          <li>
                            En esta sección debes responder las preguntas que ayudarán a realizar la descripción del
                            alcance del tratamiento.
                          </li>
                        </ol>
                      </div>
                      <div className="space-y-2">
                        <p className="font-semibold text-foreground">Instrucciones para el Usuario de la Plataforma</p>
                        <ul className="list-disc space-y-1 pl-5">
                          <li>
                            Sea específico con los activos: No mencione solo "servidores"; identifique si se trata de
                            nubes privadas, públicas o infraestructura local.
                          </li>
                          <li>
                            Mapee los flujos: Identifique no solo cómo entra el dato, sino por qué manos pasa
                            (empleados, proveedores externos, autoridades).
                          </li>
                          <li>
                            Finalidades separadas: Si un tratamiento tiene tres finalidades distintas, descríbalas de
                            forma individual para validar la licitud de cada una.
                          </li>
                        </ul>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label>Infraestructura tecnológica</Label>
                        <Textarea
                          className="mt-2"
                          value={infrastructure}
                          onChange={(event) => setInfrastructure(event.target.value)}
                          placeholder="Nube pública/privada, servidores locales, apps, etc."
                        />
                      </div>
                      <div>
                        <Label>Flujos de datos</Label>
                        <Textarea
                          className="mt-2"
                          value={dataFlows}
                          onChange={(event) => setDataFlows(event.target.value)}
                          placeholder="Ingreso, almacenamiento, transferencia, eliminación, terceros."
                        />
                      </div>
                      <div>
                        <Label>Activos críticos</Label>
                        <Textarea
                          className="mt-2"
                          value={assets}
                          onChange={(event) => setAssets(event.target.value)}
                          placeholder="Bases de datos, sistemas, documentación, personal clave."
                        />
                      </div>
                      <div>
                        <Label>Decisiones automatizadas o IA</Label>
                        <Textarea
                          className="mt-2"
                          value={automatedDecisions}
                          onChange={(event) => setAutomatedDecisions(event.target.value)}
                          placeholder="Describe la lógica y la intervención humana."
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {sections[0].questions.map((question) => (
                        <QuestionItem
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          value={answers[question.id]}
                          variant="simple"
                          onInfo={() => setGlossaryKey(getGlossaryKeyForSection(1))}
                          onChange={(value) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: value,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div ref={(el) => { slideRefs.current[3] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{sections[1].title}</CardTitle>
                    <CardDescription>
                      Valida la licitud, necesidad y proporcionalidad del tratamiento.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground">Base jurídica principal</Label>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                        {baseLegalOptions.map((option) => (
                          <label key={option} className="flex items-center space-x-2 text-sm text-foreground">
                            <Checkbox
                              checked={baseLegal.includes(option)}
                              onCheckedChange={() => toggleBaseLegal(option)}
                            />
                            <span>{option}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-4">
                        <Label>Notas o evidencia de la base legal</Label>
                        <Textarea
                          className="mt-2"
                          value={baseLegalNotes}
                          onChange={(event) => setBaseLegalNotes(event.target.value)}
                          placeholder="Artículo, contrato, mecanismo de consentimiento, anexos, etc."
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      {sections[1].questions.map((question) => (
                        <QuestionItem
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          value={answers[question.id]}
                          variant="simple"
                          onInfo={() => setGlossaryKey(getGlossaryKeyForSection(2))}
                          onChange={(value) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: value,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div ref={(el) => { slideRefs.current[4] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{sections[2].title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <Label className="text-base font-semibold text-foreground">Amenazas seleccionables</Label>
                      <Accordion type="multiple" className="mt-3 space-y-2">
                        {Object.entries(groupedThreats).map(([category, threats]) => (
                          <AccordionItem key={category} value={category}>
                            <AccordionTrigger className="text-sm font-semibold">
                              {category}
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3">
                              {threats.map((threat) => (
                                <label key={threat.id} className="flex items-start space-x-2 text-sm">
                                  <Checkbox
                                    checked={selectedThreats.includes(threat.id)}
                                    onCheckedChange={() => toggleSelection(threat.id, setSelectedThreats)}
                                  />
                                  <span className="text-foreground">{threat.label}</span>
                                </label>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>

                    {selectedThreats.length > 0 && (
                      <div className="space-y-4">
                        {riskAnalysis.map((risk) => (
                          <div key={risk.id} className="rounded-xl border border-muted/60 p-4">
                            <p className="font-semibold text-foreground">
                              {risk.category}: {risk.label}
                            </p>
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div>
                                <Label>Probabilidad (1-3)</Label>
                                <Select
                                  value={String(risk.assessment.probability)}
                                  onValueChange={(value) =>
                                    setRiskAssessments((prev) => ({
                                      ...prev,
                                      [risk.id]: {
                                        ...prev[risk.id],
                                        probability: Number(value),
                                      },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Seleccione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Baja (1)</SelectItem>
                                    <SelectItem value="2">Media (2)</SelectItem>
                                    <SelectItem value="3">Alta (3)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Impacto (1-4)</Label>
                                <Select
                                  value={String(risk.assessment.impact)}
                                  onValueChange={(value) =>
                                    setRiskAssessments((prev) => ({
                                      ...prev,
                                      [risk.id]: {
                                        ...prev[risk.id],
                                        impact: Number(value),
                                      },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Seleccione" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">Bajo (1)</SelectItem>
                                    <SelectItem value="2">Medio (2)</SelectItem>
                                    <SelectItem value="3">Alto (3)</SelectItem>
                                    <SelectItem value="4">Muy alto (4)</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Justificación</Label>
                                <Input
                                  className="mt-2"
                                  value={risk.assessment.justification}
                                  onChange={(event) =>
                                    setRiskAssessments((prev) => ({
                                      ...prev,
                                      [risk.id]: {
                                        ...prev[risk.id],
                                        justification: event.target.value,
                                      },
                                    }))
                                  }
                                  placeholder="Contexto y evidencia del análisis."
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedThreats.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground">
                        Selecciona amenazas para habilitar el análisis de riesgo y los controles sugeridos.
                      </div>
                    ) : (
                      <Card className="border border-muted/60">
                        <CardHeader>
                          <CardTitle className="text-base">Controles sugeridos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {recommendedControls.map((control) => {
                            const state = controlStates[control.id] ?? defaultControlState
                            return (
                              <div key={control.id} className="rounded-xl border border-muted/40 p-4">
                                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                  <div>
                                    <p className="font-medium text-foreground">{control.label}</p>
                                    <p className="text-sm text-muted-foreground">{control.requirement}</p>
                                  </div>
                                  <Badge variant="outline">
                                    {control.affects === "probability" ? "Preventivo" : "Correctivo"}
                                  </Badge>
                                </div>
                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                                  <div>
                                    <Label>Estado</Label>
                                    <Select
                                      value={state.status}
                                      onValueChange={(value) =>
                                        setControlStates((prev) => ({
                                          ...prev,
                                          [control.id]: {
                                            ...prev[control.id],
                                            status: value as "implementado" | "planificado" | "no-aplica",
                                          },
                                        }))
                                      }
                                    >
                                      <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Seleccione estado" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="implementado">Implementado</SelectItem>
                                        <SelectItem value="planificado">Planificado</SelectItem>
                                        <SelectItem value="no-aplica">No aplica</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label>Evidencia</Label>
                                    <Input
                                      type="file"
                                      className="mt-2"
                                      onChange={(event) =>
                                        setControlStates((prev) => ({
                                          ...prev,
                                          [control.id]: {
                                            ...prev[control.id],
                                            evidence: event.target.files?.[0]?.name || "",
                                          },
                                        }))
                                      }
                                    />
                                    {state.evidence && (
                                      <p className="mt-1 text-xs text-muted-foreground">{state.evidence}</p>
                                    )}
                                  </div>
                                  <div>
                                    <Label>
                                      {state.status === "planificado"
                                        ? "Fecha compromiso"
                                        : state.status === "no-aplica"
                                          ? "Justificación"
                                          : "Notas"}
                                    </Label>
                                    {state.status === "planificado" ? (
                                      <Input
                                        type="date"
                                        className="mt-2"
                                        value={state.dueDate}
                                        onChange={(event) =>
                                          setControlStates((prev) => ({
                                            ...prev,
                                            [control.id]: {
                                              ...prev[control.id],
                                              dueDate: event.target.value,
                                            },
                                          }))
                                        }
                                      />
                                    ) : (
                                      <Input
                                        className="mt-2"
                                        value={state.justification}
                                        onChange={(event) =>
                                          setControlStates((prev) => ({
                                            ...prev,
                                            [control.id]: {
                                              ...prev[control.id],
                                              justification: event.target.value,
                                            },
                                          }))
                                        }
                                        placeholder="Detalle adicional"
                                      />
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {hasHighResidualRisk && (
                            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
                              <p className="text-sm font-semibold text-destructive">
                                Atención: riesgo residual alto.
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Se recomienda definir medidas adicionales y valorar consulta previa con la autoridad.
                              </p>
                              <div className="mt-3">
                                <Label>Medidas de mitigación adicionales</Label>
                                <Textarea
                                  className="mt-2"
                                  value={additionalMeasures}
                                  onChange={(event) => setAdditionalMeasures(event.target.value)}
                                  placeholder="Describe controles compensatorios o soluciones adicionales."
                                />
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div ref={(el) => { slideRefs.current[5] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{sections[3].title}</CardTitle>
                    <CardDescription>
                      Este módulo audita la capacidad operativa para garantizar el ejercicio efectivo de los
                      derechos ARCO+ (Acceso, Rectificación, Cancelación, Oposición, Revocación de Consentimiento y
                      Limitación). Su objetivo es validar que el tratamiento incluya mecanismos técnicos y
                      organizativos que aseguren respuestas ágiles, gratuitas y trazables, generando la evidencia
                      necesaria para cumplir con el principio de Accountability.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">Instrucciones</p>
                      <ol className="list-decimal space-y-1 pl-5">
                        <li>
                          Definir Canales: Identificar los medios de contacto (web, correo, oficinas) para recibir
                          solicitudes.
                        </li>
                        <li>
                          Describir el Flujo: Detallar el proceso interno desde la validación de identidad hasta la
                          notificación de la respuesta.
                        </li>
                        <li>
                          Verificar Funcionalidades: Confirmar si el sistema permite técnicamente la supresión,
                          portabilidad o marcado de limitación de datos.
                        </li>
                        <li>
                          Gestionar Decisiones IA: Si aplica, documentar cómo se garantiza la intervención humana ante
                          decisiones automatizadas.
                        </li>
                        <li>
                          Cargar Evidencia: Adjuntar protocolos, manuales o capturas de las interfaces de atención al
                          titular.
                        </li>
                      </ol>
                    </div>
                    <div className="space-y-4">
                      {sections[3].questions.map((question) => (
                        <QuestionItem
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          value={answers[question.id]}
                          variant="simple"
                          onInfo={() => setGlossaryKey(getGlossaryKeyForSection(3))}
                          onChange={(value) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: value,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div ref={(el) => { slideRefs.current[6] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{sections[4].title}</CardTitle>
                    <CardDescription>
                      Aplica controles técnicos, organizativos y físicos para pasar del riesgo inherente al residual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-semibold text-foreground">Matriz comparativa: Antes vs Después</p>
                      <p className="text-xs text-muted-foreground">
                        Comparativo en tiempo real del riesgo inherente (antes) y residual (después).
                      </p>
                      {riskAnalysis.length === 0 ? (
                        <p className="mt-3 text-xs text-muted-foreground">
                          Selecciona amenazas en la evaluación de riesgos para visualizar el comparativo.
                        </p>
                      ) : (
                        <div className="mt-3 overflow-auto">
                          <Table className="min-w-[640px]">
                            <TableHeader>
                              <TableRow>
                                <TableHead>Amenaza</TableHead>
                                <TableHead>Antes (Inherente)</TableHead>
                                <TableHead>Después (Residual)</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {riskAnalysis.map((risk) => (
                                <TableRow key={risk.id}>
                                  <TableCell className="font-medium text-foreground">
                                    {risk.category}: {risk.label}
                                  </TableCell>
                                  <TableCell>
                                    {risk.inherent.color} {risk.inherent.label} ({risk.assessment.probability}×
                                    {risk.assessment.impact})
                                  </TableCell>
                                  <TableCell>
                                    {risk.residual.color} {risk.residual.label} ({risk.residualProbability}×
                                    {risk.residualImpact})
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {sections[4].questions.map((question) => (
                        <QuestionItem
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          value={answers[question.id]}
                          variant="simple"
                          onInfo={() => setGlossaryKey(getGlossaryKeyForSection(3))}
                          onChange={(value) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: value,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div ref={(el) => { slideRefs.current[7] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{sections[5].title}</CardTitle>
                    <CardDescription>
                      Este módulo consolida toda la información recopilada en un documento formal único. Su propósito es
                      servir como el registro oficial de la EIPD para tener evidencia obetiva y demostrable de que la EIPD
                      se ejecutó en tiempo y forma.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">Instrucciones</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5">
                        <li>Revise el resumen ejecutivo generado automáticamente por el sistema.</li>
                        <li>Añada una conclusión final sobre la viabilidad del tratamiento.</li>
                        <li>Complete la sección de firmas para habilitar el cierre final.</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground">
                      La descarga del reporte final estará disponible al completar la última sección del proceso.
                    </div>
                    <div>
                      <Label>Conclusión final sobre la viabilidad del tratamiento</Label>
                      <Textarea
                        className="mt-2"
                        value={conclusion}
                        onChange={(event) => setConclusion(event.target.value)}
                        placeholder="Resumen ejecutivo, viabilidad y decisiones."
                      />
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-semibold text-foreground">Módulo de firma multidisciplinaria</p>
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                        {(Object.keys(signatures) as Array<keyof typeof signatures>).map((key) => (
                          <div key={key} className="space-y-2">
                            <Label>{signatures[key].role}</Label>
                            <Input
                              placeholder="Nombre"
                              value={signatures[key].name}
                              onChange={(event) =>
                                setSignatures((prev) => ({
                                  ...prev,
                                  [key]: { ...prev[key], name: event.target.value },
                                }))
                              }
                            />
                            <Input
                              type="file"
                              onChange={(event) =>
                                setSignatures((prev) => ({
                                  ...prev,
                                  [key]: {
                                    ...prev[key],
                                    evidence: event.target.files?.[0]?.name || "",
                                    signedAt: new Date().toISOString(),
                                  },
                                }))
                              }
                            />
                            {signatures[key].evidence && (
                              <p className="text-xs text-muted-foreground">{signatures[key].evidence}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-semibold text-foreground">Índice de evidencias (Secciones 2 a 6)</p>
                      {evidenceIndex.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Aún no se han cargado evidencias.</p>
                      ) : (
                        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                          {evidenceIndex.map((evidence) => (
                            <li key={evidence}>{evidence}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-4">
                      {sections[5].questions.map((question) => (
                        <QuestionItem
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          value={answers[question.id]}
                          variant="simple"
                          onInfo={() => setGlossaryKey(getGlossaryKeyForSection(4))}
                          onChange={(value) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: value,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div ref={(el) => { slideRefs.current[8] = el }} className="min-w-full space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{sections[6].title}</CardTitle>
                    <CardDescription>
                      Descripción: La EIPD no es un documento estático. Este módulo establece el calendario y los
                      criterios para la actualización periódica de la evaluación, asegurando que el tratamiento se
                      mantenga seguro frente a nuevas amenazas o cambios tecnológicos.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="rounded-lg border border-dashed border-muted-foreground/40 p-4">
                      <p className="text-sm font-semibold text-foreground">Gestión posterior de la EIPD</p>
                      <p className="text-xs text-muted-foreground">
                        Apartado diseñado para programar revisiones, documentar cambios y preparar actualizaciones
                        rápidas de la evaluación sin recargar la vista.
                      </p>
                    </div>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="font-semibold text-foreground">Instrucciones</p>
                      <ol className="list-decimal space-y-1 pl-5">
                        <li>Programe la fecha de la próxima revisión periódica (mínimo anual).</li>
                        <li>Defina los "disparadores" (triggers) que obligarían a una revisión extraordinaria inmediata.</li>
                      </ol>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <Label>Fecha de próxima revisión</Label>
                        <Input
                          type="date"
                          className="mt-2"
                          value={nextReviewDate}
                          onChange={(event) => setNextReviewDate(event.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Disparadores de revisión</Label>
                        <Textarea
                          className="mt-2"
                          value={reviewTriggers}
                          onChange={(event) => setReviewTriggers(event.target.value)}
                          placeholder="Cambios tecnológicos, incidentes, quejas, etc."
                        />
                      </div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-semibold text-foreground">Alertas de calendario</p>
                      <p className="text-xs text-muted-foreground">
                        Se enviará una alerta 30 días antes de la revisión programada.
                      </p>
                      <label className="mt-3 flex items-center space-x-2 text-sm text-foreground">
                        <Checkbox
                          checked={calendarConfirmed}
                          onCheckedChange={(checked) => setCalendarConfirmed(Boolean(checked))}
                        />
                        <span>Confirmar recordatorio en calendario</span>
                      </label>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-semibold text-foreground">Log de cambios</p>
                      <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
                        <Input type="date" value={new Date().toISOString().slice(0, 10)} readOnly />
                        <Input
                          placeholder="Motivo de la revisión"
                          value={reviewLogReason}
                          onChange={(event) => setReviewLogReason(event.target.value)}
                        />
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!reviewLogReason.trim()) return
                            setReviewLog((prev) => [
                              { date: new Date().toISOString(), reason: reviewLogReason.trim() },
                              ...prev,
                            ])
                            setReviewLogReason("")
                          }}
                        >
                          Registrar cambio
                        </Button>
                      </div>
                      {reviewLog.length > 0 && (
                        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                          {reviewLog.map((entry, index) => (
                            <li key={`${entry.date}-${index}`}>
                              {new Date(entry.date).toLocaleDateString("es-MX")}: {entry.reason}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-semibold text-foreground">Control de versiones</p>
                      <p className="text-xs text-muted-foreground">Versión actual: {versionInfo.version}</p>
                      {versionInfo.history.length > 0 && (
                        <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                          {versionInfo.history.map((entry) => (
                            <li key={`${entry.version}-${entry.updatedAt}`}>
                              {entry.version} - {formatDateTime(entry.updatedAt)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="space-y-4">
                      {sections[6].questions.map((question) => (
                        <QuestionItem
                          key={question.id}
                          id={question.id}
                          question={question.question}
                          value={answers[question.id]}
                          variant="simple"
                          onInfo={() => setGlossaryKey(getGlossaryKeyForSection(4))}
                          onChange={(value) =>
                            setAnswers((prev) => ({
                              ...prev,
                              [question.id]: value,
                            }))
                          }
                        />
                      ))}
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm font-semibold text-foreground">Cierre y descarga final</p>
                      <p className="text-xs text-muted-foreground">
                        Las opciones de descarga se habilitan al completar todo el proceso y registrar las firmas.
                      </p>
                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div>
                          <Label>Versión de exportación</Label>
                          <Select
                            value={exportMode}
                            onValueChange={(value) => setExportMode(value as "completa" | "ejecutiva" | "publica")}
                          >
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Seleccione versión" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="completa">Versión completa (Auditoría)</SelectItem>
                              <SelectItem value="ejecutiva">Versión ejecutiva</SelectItem>
                              <SelectItem value="publica">Versión pública/Extracto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-2">
                          <Label>Vista previa</Label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!hasSignatureNames}>
                              Ver vista previa
                            </Button>
                            <Button onClick={() => handleGenerateReport(exportMode)} disabled={!canExportReport}>
                              Generar Informe Final EIPD
                            </Button>
                          </div>
                          {!hasSignatureNames && (
                            <p className="text-xs text-destructive">Registra las firmas para habilitar la descarga.</p>
                          )}
                          {!canDownloadPdf && (
                            <p className="text-xs text-destructive">
                              Riesgo residual alto: registra medidas adicionales para habilitar la descarga.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="secondary" onClick={() => handleGenerateReport("completa")} disabled={!canExportReport}>
                          Descargar versión completa
                        </Button>
                        <Button variant="outline" onClick={() => handleGenerateReport("ejecutiva")} disabled={!canExportReport}>
                          Descargar versión ejecutiva
                        </Button>
                        <Button variant="outline" onClick={() => handleGenerateReport("publica")} disabled={!canExportReport}>
                          Descargar versión pública
                        </Button>
                        <Button variant="outline" onClick={() => generateDocx(currentForm, exportMode)} disabled={!canExportReport}>
                          Exportar DOCX
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-4">
            <div className="text-sm text-muted-foreground">
              Fase {activeStep + 1} de {totalSteps} · {stepTitles[activeStep]}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={prevStep} disabled={activeStep === 0}>
                Anterior
              </Button>
              <Button
                onClick={nextStep}
                disabled={activeStep === totalSteps - 1 || (activeStep === 0 && !isNameValid)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="w-[95vw] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Vista previa del reporte EIPD</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-foreground">Resumen ejecutivo</p>
              <p className="text-muted-foreground">Formulario: {currentForm.name}</p>
              <p className="text-muted-foreground">
                Diagnóstico: {diagnostic.title} {diagnostic.description}
              </p>
              <p className="text-muted-foreground">
                Cumplimiento: {complianceSummary.color} {complianceSummary.label} ({complianceSummary.percent}%)
              </p>
              <p className="text-muted-foreground">
                Versión seleccionada: {exportMode === "completa" ? "Completa" : exportMode === "ejecutiva" ? "Ejecutiva" : "Pública"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-foreground">Índice de evidencias</p>
              {evidenceIndex.length === 0 ? (
                <p className="text-muted-foreground">No hay evidencias adjuntas.</p>
              ) : (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                  {evidenceIndex.map((evidence) => (
                    <li key={evidence}>{evidence}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-semibold text-foreground">Firmas registradas</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {(Object.keys(signatures) as Array<keyof typeof signatures>).map((key) => (
                  <li key={key}>
                    {signatures[key].role}: {signatures[key].name || "Pendiente"}{" "}
                    {signatures[key].evidence ? "(evidencia cargada)" : ""}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleGenerateReport(exportMode)} disabled={!canDownloadPdf}>
                Generar Informe Final EIPD
              </Button>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(glossaryKey)} onOpenChange={(open) => !open && setGlossaryKey(null)}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Glosario Dinámico</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {glossaryKey ? glossary[glossaryKey] : "Selecciona un término para ver su definición."}
          </p>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setGlossaryKey(null)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
