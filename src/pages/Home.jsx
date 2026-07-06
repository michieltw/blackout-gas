import React from "react";
import { Link } from "react-router-dom";
import { LayoutDashboard, Trophy, Users, Calendar, Timer, Shield } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function Home() {
  const quickLinks = [
    { label: 'Live Games', path: '/live', icon: Timer, desc: 'View live scoreboard and events' },
    { label: 'Scorekeeper', path: '/scorekeeper', icon: Timer, desc: 'Manage active games' },
    { label: 'Schedule', path: '/schedule', icon: Calendar, desc: 'Upcoming games and times' },
    { label: 'Standings', path: '/standings', icon: Trophy, desc: 'League rankings' },
    { label: 'Teams', path: '/teams', icon: Shield, desc: 'Team rosters and details' },
    { label: 'Players', path: '/players', icon: Users, desc: 'Player directory' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to the Blackout League Manager.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.path} to={link.path}>
              <Card className="hover:bg-secondary/50 transition-colors cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-medium">{link.label}</CardTitle>
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>{link.desc}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
