import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Download,
  Calendar,
  BarChart3,
  RefreshCw,
  MessageSquare,
  Zap,
  Bot,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Facebook,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { fetchDashboardStats, fetchExecutionLogs, fetchConnectedAccounts, DashboardStats, ExecutionLog, ConnectedAccount } from "@/services/apiService";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import * as XLSX from "xlsx";
import { formatDistanceToNow, format, parseISO, startOfDay, eachDayOfInterval, isWithinInterval } from "date-fns";

const OnlineReports = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [connectedPages, setConnectedPages] = useState<ConnectedAccount[]>([]);

  useEffect(() => {
    loadReportData();
  }, [startDate, endDate]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      const [statsData, logsData, pagesData] = await Promise.all([
        fetchDashboardStats(),
        fetchExecutionLogs(500), // Get more logs for date range filtering
        fetchConnectedAccounts("facebook"),
      ]);
      setStats(statsData);
      setLogs(logsData);
      setConnectedPages(pagesData.filter(p => p.is_connected));
    } catch (error) {
      console.error("Failed to load report data:", error);
      toast.error("Failed to load report data");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter logs by date range
  const filteredLogs = useMemo(() => {
    const start = startOfDay(parseISO(startDate));
    const end = startOfDay(parseISO(endDate));
    end.setHours(23, 59, 59, 999);
    
    return logs.filter(log => {
      if (!log.created_at) return false;
      const logDate = parseISO(log.created_at);
      return isWithinInterval(logDate, { start, end });
    });
  }, [logs, startDate, endDate]);

  // Calculate daily activity from real logs
  const dailyActivityData = useMemo(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      const dayLogs = filteredLogs.filter(log => 
        log.created_at && format(parseISO(log.created_at), "yyyy-MM-dd") === dayStr
      );
      
      const successful = dayLogs.filter(l => l.status === "success").length;
      const failed = dayLogs.filter(l => l.status === "failed").length;
      
      return {
        date: dayStr,
        messages: dayLogs.length,
        successful,
        failed,
      };
    });
  }, [filteredLogs, startDate, endDate]);

  // Calculate status breakdown for pie chart
  const statusBreakdown = useMemo(() => {
    const successful = filteredLogs.filter(l => l.status === "success").length;
    const failed = filteredLogs.filter(l => l.status === "failed").length;
    return [
      { name: "Successful", value: successful, color: "hsl(142, 76%, 36%)" },
      { name: "Failed", value: failed, color: "hsl(0, 84%, 60%)" },
    ];
  }, [filteredLogs]);

  // Calculate event type breakdown
  const eventTypeBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredLogs.forEach(log => {
      const type = log.event_type || "unknown";
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredLogs]);

  // Calculate summary stats for filtered period
  const periodStats = useMemo(() => {
    const totalMessages = filteredLogs.length;
    const successful = filteredLogs.filter(l => l.status === "success").length;
    const failed = filteredLogs.filter(l => l.status === "failed").length;
    const successRate = totalMessages > 0 ? Math.round((successful / totalMessages) * 100) : 0;
    const avgProcessingTime = filteredLogs.length > 0 
      ? Math.round(filteredLogs.reduce((sum, l) => sum + (l.processing_time_ms || 0), 0) / filteredLogs.length)
      : 0;
    const hoursSaved = Math.round((totalMessages * 2) / 60 * 10) / 10; // 2 min per message
    
    return {
      totalMessages,
      successful,
      failed,
      successRate,
      avgProcessingTime,
      hoursSaved,
      estimatedValue: Math.round(hoursSaved * 100),
    };
  }, [filteredLogs]);

  const summaryCards = [
    {
      title: "Total Messages",
      value: periodStats.totalMessages.toString(),
      subtitle: "In selected period",
      icon: MessageSquare,
      color: "from-primary to-primary-glow",
    },
    {
      title: "Auto-Replies Sent",
      value: periodStats.successful.toString(),
      subtitle: `${periodStats.successRate}% success rate`,
      icon: Zap,
      color: "from-success to-emerald-400",
    },
    {
      title: "Failed Replies",
      value: periodStats.failed.toString(),
      subtitle: "Need attention",
      icon: XCircle,
      color: "from-destructive to-red-400",
    },
    {
      title: "Hours Saved",
      value: periodStats.hoursSaved.toString(),
      subtitle: `৳${periodStats.estimatedValue} value`,
      icon: Clock,
      color: "from-secondary to-primary",
    },
  ];

  const handleExport = () => {
    if (filteredLogs.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = filteredLogs.map(log => ({
      "Date": log.created_at ? format(parseISO(log.created_at), "yyyy-MM-dd HH:mm:ss") : "",
      "Event Type": log.event_type || "",
      "Status": log.status || "",
      "Platform": log.source_platform || "",
      "Processing Time (ms)": log.processing_time_ms || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Automation Logs");
    
    // Add summary sheet
    const summaryData = [
      { Metric: "Total Messages", Value: periodStats.totalMessages },
      { Metric: "Successful Replies", Value: periodStats.successful },
      { Metric: "Failed Replies", Value: periodStats.failed },
      { Metric: "Success Rate", Value: `${periodStats.successRate}%` },
      { Metric: "Avg Processing Time", Value: `${periodStats.avgProcessingTime}ms` },
      { Metric: "Hours Saved", Value: periodStats.hoursSaved },
      { Metric: "Estimated Value", Value: `৳${periodStats.estimatedValue}` },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");
    
    XLSX.writeFile(wb, `automation-report-${startDate}-to-${endDate}.xlsx`);
    toast.success("Report exported successfully!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              Automation Reports
            </h1>
            <p className="text-muted-foreground">
              Analytics for your AI automation performance
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadReportData} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={handleExport} disabled={isLoading || filteredLogs.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Date Range */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <Label>Date Range:</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-auto"
                />
                <span className="text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <Badge variant="outline" className="ml-auto gap-1">
                <Facebook className="w-3 h-3" />
                {connectedPages.length} Connected Pages
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                      <card.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {isLoading ? (
                    <Skeleton className="h-7 w-24 mb-1" />
                  ) : (
                    <div className="text-xl font-bold">{card.value}</div>
                  )}
                  <div className="text-xs text-muted-foreground">{card.title}</div>
                  <div className="text-xs text-muted-foreground/70">{card.subtitle}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Activity Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Activity</CardTitle>
              <CardDescription>Messages handled by day</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : dailyActivityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={dailyActivityData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(val) => format(parseISO(val), "MMM d")}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(label) => format(parseISO(label as string), "MMM d, yyyy")}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="successful"
                      name="Successful"
                      stackId="1"
                      stroke="hsl(142, 76%, 36%)"
                      fill="hsl(142, 76%, 36%, 0.3)"
                    />
                    <Area
                      type="monotone"
                      dataKey="failed"
                      name="Failed"
                      stackId="1"
                      stroke="hsl(0, 84%, 60%)"
                      fill="hsl(0, 84%, 60%, 0.3)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No activity data for selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Status Breakdown</CardTitle>
              <CardDescription>Success vs failure rate</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[300px] w-full" />
              ) : periodStats.totalMessages > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  No data for selected period
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Event Type Breakdown */}
        {eventTypeBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Event Types</CardTitle>
              <CardDescription>Breakdown by automation trigger type</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={eventTypeBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="value" name="Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        )}

        {/* Recent Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest {Math.min(20, filteredLogs.length)} automation executions in selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Event Type</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Processing Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No activity in selected date range
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.slice(0, 20).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground">
                          {log.created_at ? formatDistanceToNow(parseISO(log.created_at), { addSuffix: true }) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.event_type || "unknown"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="gap-1">
                            {log.source_platform === "facebook" && <Facebook className="w-3 h-3" />}
                            {log.source_platform || "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {log.status === "success" ? (
                            <Badge className="bg-success/10 text-success border-success/20 gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Success
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="w-3 h-3" /> Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {log.processing_time_ms ? `${log.processing_time_ms}ms` : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Connected Pages Info */}
        {connectedPages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Facebook className="w-5 h-5 text-blue-500" />
                Connected Pages
              </CardTitle>
              <CardDescription>Pages with active automation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {connectedPages.map(page => (
                  <div
                    key={page.id}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{page.name || "Unnamed Page"}</div>
                      <div className="text-xs text-muted-foreground">
                        Connected {page.created_at ? formatDistanceToNow(parseISO(page.created_at), { addSuffix: true }) : ""}
                      </div>
                    </div>
                    <Badge className="bg-success/10 text-success border-success/20">Active</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Pages Connected */}
        {connectedPages.length === 0 && !isLoading && (
          <Card className="border-dashed border-2 bg-muted/20">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 py-6">
              <div className="text-center md:text-left">
                <h3 className="font-semibold mb-1">No Pages Connected</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your Facebook pages to start automating responses.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/dashboard/automations">
                  <Bot className="w-4 h-4 mr-2" />
                  Setup Automation
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default OnlineReports;
