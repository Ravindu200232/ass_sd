import React from "react";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Building, UserCog, MapPin, Phone, Mail, Hash } from "lucide-react";

export const DepartmentInfoSection = ({ user, departmentInfo, stockData }) => {
  return (
    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      <CardHeader className="border-b bg-muted/30 pb-6">
        <CardTitle className="flex items-start gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary rounded-xl blur opacity-25" />
            <div className="relative p-3 rounded-xl bg-primary text-primary-foreground shadow-lg">
              <Building className="h-6 w-6" />
            </div>
          </div>
          <div className="flex-1">
            <div className="font-bold tracking-tight text-foreground text-2xl mb-1">
              Your Department Information
            </div>
            <CardDescription className="text-sm flex items-center gap-2 flex-wrap">
              <span>Complete overview of {departmentInfo.department_name}</span>
              {stockData.total_items === 0 && (
                <span className="px-2 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-semibold">
                  ⚠ No stock items - Add GRN entries
                </span>
              )}
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Department Details Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl" />
            <div className="relative p-6 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <h4 className="font-bold text-foreground text-lg">Department Details</h4>
              </div>
              
              <div className="space-y-5">
                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <Hash className="h-3 w-3" />
                    Department Code
                  </div>
                  <div className="font-bold text-2xl text-primary tracking-tight">
                    {departmentInfo.department_code}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <Building className="h-3 w-3" />
                    Department Name
                  </div>
                  <div className="font-bold text-xl text-foreground">
                    {departmentInfo.department_name}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <MapPin className="h-3 w-3" />
                    Address
                  </div>
                  <div className="font-medium text-foreground leading-relaxed">
                    {departmentInfo.department_address || (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <Phone className="h-3 w-3" />
                    Contact
                  </div>
                  <div className="font-medium text-foreground">
                    {departmentInfo.department_contact || (
                      <span className="text-muted-foreground italic">Not specified</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* User Profile Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-xl" />
            <div className="relative p-6 rounded-xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <UserCog className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h4 className="font-bold text-foreground text-lg">Your Profile</h4>
              </div>
              
              <div className="space-y-5">
                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <Hash className="h-3 w-3" />
                    Employee Code
                  </div>
                  <div className="font-bold text-2xl text-emerald-600 dark:text-emerald-400 tracking-tight">
                    {user.user_code}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <UserCog className="h-3 w-3" />
                    Full Name
                  </div>
                  <div className="font-bold text-xl text-foreground">
                    {user.full_name}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <Mail className="h-3 w-3" />
                    NIC Number
                  </div>
                  <div className="font-medium text-foreground font-mono">
                    {user.nic_no}
                  </div>
                </div>

                <div className="h-px bg-border/50" />

                <div className="group/item">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">
                    <Phone className="h-3 w-3" />
                    Phone Number
                  </div>
                  <div className="font-medium text-foreground font-mono">
                    {user.phone_no_01}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};