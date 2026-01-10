import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  Calendar,
  Download,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Image,
  Mic,
  MessageCircle,
  Check,
  X,
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { format, formatDistanceToNow, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { fetchExecutionLogs, ExecutionLog } from "@/services/apiService";

const LOGS_PER_PAGE = 10;

const typeIcons = {
  message: MessageSquare,
  image: Image,
  voice: Mic,
  comment: MessageCircle,
};

const typeColors = {
  message: "bg-primary/10 text-primary",
  image: "bg-secondary/10 text-secondary",
  voice: "bg-accent/10 text-accent",
  comment: "bg-muted text-muted-foreground",
};

const Logs = () => {
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadLogs = useCallback(async (showRefresh = false) => {
    if (showRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    
    try {
      const data = await fetchExecutionLogs(500); // Fetch up to 500 logs
      setLogs(data);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleRefresh = () => {
    loadLogs(true);
  };

  // Filter logs based on search and filters
  const filteredLogs = logs.filter((log) => {
    const automationName = log.automations?.name || log.event_type || "";
    const matchesSearch =
      automationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.source_platform || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.event_type || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || log.source_platform === platformFilter;
    
    let matchesDate = true;
    if (dateFrom && dateTo && log.created_at) {
      const logDate = new Date(log.created_at);
      matchesDate = isWithinInterval(logDate, {
        start: startOfDay(dateFrom),
        end: endOfDay(dateTo),
      });
    } else if (dateFrom && log.created_at) {
      const logDate = new Date(log.created_at);
      matchesDate = logDate >= startOfDay(dateFrom);
    }
    
    return matchesSearch && matchesStatus && matchesPlatform && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / LOGS_PER_PAGE);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * LOGS_PER_PAGE,
    currentPage * LOGS_PER_PAGE
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, platformFilter, dateFrom, dateTo]);

  // Calculate stats from real data
  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    failed: logs.filter((l) => l.status === "failed").length,
  };

  const getEventTypeIcon = (eventType: string | null) => {
    if (!eventType) return MessageSquare;
    if (eventType.toLowerCase().includes("image")) return Image;
    if (eventType.toLowerCase().includes("voice")) return Mic;
    if (eventType.toLowerCase().includes("comment")) return MessageCircle;
    return MessageSquare;
  };

  const getEventTypeColor = (eventType: string | null) => {
    if (!eventType) return typeColors.message;
    if (eventType.toLowerCase().includes("image")) return typeColors.image;
    if (eventType.toLowerCase().includes("voice")) return typeColors.voice;
    if (eventType.toLowerCase().includes("comment")) return typeColors.comment;
    return typeColors.message;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-end gap-2"
        >
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-1.5"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2 sm:gap-4"
        >
          <Card className="bg-muted/50">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" />
                ) : (
                  <div className="text-lg sm:text-2xl font-bold">{stats.total}</div>
                )}
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Total</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                <Check className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" />
                ) : (
                  <div className="text-lg sm:text-2xl font-bold">{stats.success}</div>
                )}
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Success</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-muted/50">
            <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              </div>
              <div className="min-w-0">
                {isLoading ? (
                  <Skeleton className="h-6 sm:h-8 w-10 sm:w-12" />
                ) : (
                  <div className="text-lg sm:text-2xl font-bold">{stats.failed}</div>
                )}
                <div className="text-[10px] sm:text-xs text-muted-foreground truncate">Failed</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* Search */}
                <div className="col-span-2 lg:col-span-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 text-sm"
                  />
                </div>

                {/* Platform Filter */}
                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Platforms</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Range */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      {dateFrom ? format(dateFrom, "MMM d") : "Date Range"}
                      {dateTo && ` - ${format(dateTo, "MMM d")}`}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      mode="range"
                      selected={{ from: dateFrom, to: dateTo }}
                      onSelect={(range) => {
                        setDateFrom(range?.from);
                        setDateTo(range?.to);
                      }}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Logs Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Execution History
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({filteredLogs.length} records)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredLogs.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Automation</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Duration</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedLogs.map((log) => {
                          const TypeIcon = getEventTypeIcon(log.event_type);
                          const isExpanded = expandedRow === log.id;

                          return (
                            <>
                              <TableRow
                                key={log.id}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => setExpandedRow(isExpanded ? null : log.id)}
                              >
                                <TableCell>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                                  {log.created_at ? (
                                    <div>
                                      <div>{format(new Date(log.created_at), "HH:mm:ss")}</div>
                                      <div className="text-xs">
                                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                                      </div>
                                    </div>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getEventTypeColor(log.event_type)}`}>
                                      <TypeIcon className="w-3 h-3" />
                                    </span>
                                    <span className="font-medium">
                                      {log.automations?.name || log.event_type || "Unknown"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="capitalize text-muted-foreground">
                                    {log.source_platform || "-"}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                                      log.status === "success"
                                        ? "bg-success/10 text-success"
                                        : "bg-destructive/10 text-destructive"
                                    }`}
                                  >
                                    {log.status ? log.status.charAt(0).toUpperCase() + log.status.slice(1) : "-"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {log.processing_time_ms ? `${log.processing_time_ms}ms` : "-"}
                                </TableCell>
                              </TableRow>
                              
                              {/* Expanded Details */}
                              {isExpanded && (
                                <TableRow key={`${log.id}-expanded`}>
                                  <TableCell colSpan={6} className="bg-muted/30 p-0">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="p-4 space-y-4"
                                    >
                                      <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                          <div className="text-xs font-semibold text-muted-foreground mb-1">
                                            INCOMING PAYLOAD
                                          </div>
                                          <div className="p-3 rounded-lg bg-card border border-border overflow-auto max-h-40">
                                            <pre className="text-xs">
                                              {log.incoming_payload 
                                                ? JSON.stringify(log.incoming_payload, null, 2) 
                                                : "No incoming data"}
                                            </pre>
                                          </div>
                                        </div>
                                        <div>
                                          <div className="text-xs font-semibold text-muted-foreground mb-1">
                                            RESPONSE PAYLOAD
                                          </div>
                                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 overflow-auto max-h-40">
                                            <pre className="text-xs">
                                              {log.response_payload 
                                                ? JSON.stringify(log.response_payload, null, 2) 
                                                : "No response data"}
                                            </pre>
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex flex-wrap gap-4 text-sm">
                                        <div>
                                          <span className="text-muted-foreground">Log ID: </span>
                                          <span className="font-mono text-xs">{log.id}</span>
                                        </div>
                                        {log.automation_id && (
                                          <div>
                                            <span className="text-muted-foreground">Automation ID: </span>
                                            <span className="font-mono text-xs">{log.automation_id}</span>
                                          </div>
                                        )}
                                        {log.created_at && (
                                          <div>
                                            <span className="text-muted-foreground">Full Time: </span>
                                            <span className="font-medium">
                                              {format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </motion.div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
                      <span className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * LOGS_PER_PAGE + 1} to{" "}
                        {Math.min(currentPage * LOGS_PER_PAGE, filteredLogs.length)} of{" "}
                        {filteredLogs.length} logs
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Bot className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1">No logs found</h3>
                  <p className="text-sm text-muted-foreground">
                    {logs.length === 0 
                      ? "No automation executions yet. Create an automation to get started."
                      : "Try adjusting your filters or search query"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};

export default Logs;
