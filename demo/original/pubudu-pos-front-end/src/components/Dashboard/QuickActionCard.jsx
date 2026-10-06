import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightCircle } from "lucide-react";

export const QuickActionCard = ({ title, icon: Icon, href }) => {
  return (
    <Card className="
      group relative overflow-hidden border-0 shadow-md 
      hover:shadow-xl transition-all duration-300 hover:-translate-y-1 
      bg-gradient-to-br from-[#ffffff] via-[#F6FBFF] to-[#D1E8FF]
      dark:from-slate-900 dark:via-slate-900 dark:to-slate-800
    ">
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A6ED1]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* SAP corner accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#0A6ED1]/15 rounded-bl-full opacity-40" />

      <CardHeader className="relative pb-4">
        <CardTitle className="text-sm font-bold flex items-center gap-3">
          <div className="relative">
            {/* Glow */}
            <div className="absolute inset-0 bg-[#0A6ED1] rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity" />

            {/* Icon circle */}
            <div className="
              relative p-2.5 rounded-xl 
              bg-[#0A6ED1] text-white shadow-lg 
              group-hover:scale-110 transition-transform duration-300
            ">
              <Icon className="h-5 w-5" />
            </div>
          </div>

          <span className="text-foreground group-hover:text-[#0A6ED1] transition-colors">
            {title}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="relative">
        <Button
          asChild
          className="
            w-full flex items-center justify-center gap-2 
            bg-[#0A6ED1] hover:bg-[#0854A1]
            text-white shadow-lg hover:shadow-xl 
            transition-all duration-300 group-hover:scale-[1.02] 
            font-semibold py-5 rounded-lg relative overflow-hidden
          "
        >
          <a href={href}>
            {/* Hover sweep effect */}
            <span className="
              absolute inset-0 bg-gradient-to-r 
              from-transparent via-white/30 to-transparent 
              translate-x-[-200%] group-hover:translate-x-[200%] 
              transition-transform duration-700
            " />

            <span className="relative">{title}</span>
            <ArrowRightCircle className="h-4 w-4 relative group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};
