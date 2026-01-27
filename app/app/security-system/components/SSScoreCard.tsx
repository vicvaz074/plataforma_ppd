"use client";

import { SSControlCategory } from "../lib/ss-types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface Props {
  global: number;
  categories: Record<SSControlCategory, number>;
  flag?: boolean;
}

const SSScoreCard = ({ global, categories, flag }: Props) => {
  const pct = (n: number) => Math.round(n * 100);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div>
          <div className="flex justify-between text-sm">
            <span>Global</span>
            <span>{pct(global)}%</span>
          </div>
          <Progress value={pct(global)} className="h-2" />
        </div>
        <ul className="space-y-1 text-sm">
          {Object.entries(categories).map(([cat, val]) => (
            <li key={cat} className="flex justify-between">
              <span className="capitalize">{cat}</span>
              <span>{pct(val)}%</span>
            </li>
          ))}
        </ul>
        {flag && <p className="text-sm text-red-600">¡Bandera roja!</p>}
      </CardContent>
    </Card>
  );
};

export default SSScoreCard;
