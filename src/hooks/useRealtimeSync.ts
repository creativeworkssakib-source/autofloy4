/**
 * Real-time Sync Hook
 * 
 * Provides automatic real-time updates for any Supabase table.
 * When data changes anywhere, all connected clients see updates instantly.
 */

import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeSyncOptions {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
  enabled?: boolean;
}

/**
 * Subscribe to real-time changes on a Supabase table
 * 
 * @example
 * useRealtimeSync({
 *   table: 'shop_products',
 *   onChange: () => refetch(),
 * });
 */
export function useRealtimeSync({
  table,
  schema = 'public',
  filter,
  onInsert,
  onUpdate,
  onDelete,
  onChange,
  enabled = true,
}: RealtimeSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema,
          table,
          ...(filter && { filter }),
        },
        (payload) => {
          console.log(`[Realtime] ${table} change:`, payload.eventType);
          
          // Call specific handlers
          if (payload.eventType === 'INSERT' && onInsert) {
            onInsert(payload);
          } else if (payload.eventType === 'UPDATE' && onUpdate) {
            onUpdate(payload);
          } else if (payload.eventType === 'DELETE' && onDelete) {
            onDelete(payload);
          }
          
          // Always call onChange if provided
          if (onChange) {
            onChange(payload);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Subscribed to ${table}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, schema, filter, enabled]);
}

/**
 * Subscribe to multiple tables at once
 */
export function useMultiTableRealtimeSync(
  tables: string[],
  onChange: () => void,
  enabled = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const channelName = `multi-realtime-${Date.now()}`;
    let channel = supabase.channel(channelName);

    // Add listener for each table
    tables.forEach((table) => {
      channel = channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
        },
        (payload) => {
          console.log(`[Realtime] ${table} change:`, payload.eventType);
          onChange();
        }
      );
    });

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Subscribed to tables:`, tables.join(', '));
      }
    });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [tables.join(','), enabled]);
}
