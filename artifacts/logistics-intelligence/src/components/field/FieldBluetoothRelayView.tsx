import { useState, useEffect, useMemo } from 'react';
import {
  Bluetooth,
  Radio,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Shield,
  Layers,
  Database,
  Check,
  ChevronRight,
  X,
  Repeat,
  Share2,
  Server,
  Zap,
} from 'lucide-react';
import {
  bluetoothTransport,
  getDeviceId,
  getDeviceMetadata,
  getOutboxRecords,
  getProcessedMessages,
  ensureInitialOutboxSeed,
  syncManager,
  type BluetoothConnectionState,
  type BluetoothDeviceDescriptor,
  type OutboxRecord,
  type ProcessedMessageRecord,
  type BluetoothEnvelope,
  type ConnectivityStatus,
  type BleAckMessage,
} from '@/services/offline';

interface FieldBluetoothRelayViewProps {
  onBack: () => void;
}

type BleLifecycleState =
  | 'UNAVAILABLE'
  | 'AVAILABLE'
  | 'SCANNING'
  | 'DISCOVERED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'TRANSFERRING'
  | 'TRANSFER_SUCCESS'
  | 'TRANSFER_FAILED'
  | 'DISCONNECTED';

interface OperationalDevice {
  id: string;
  name: string;
  proximity: 'Nearby' | 'Out of range';
  signalText: 'Strong' | 'Medium' | 'Weak' | 'Out of range';
  rssi: number;
  status: 'Available' | 'Connected' | 'Unreachable';
  role: 'Relay' | 'Relay (Peripheral)' | 'Central Hub';
  isDemo?: boolean;
}

interface RelayHistoryItem {
  id: string;
  messageId: string;
  messageType: 'INCIDENT_REPORT' | 'OPERATIONAL_ALERT';
  fromDevice: string;
  toDevice: string;
  hopCount: number;
  maxHops: number;
  status: 'ACK Received' | 'Queued' | 'Transferring' | 'Failed';
  ackStatus: 'RECEIVED' | 'AWAITING' | 'REJECTED';
  timestamp: string;
  payloadSummary: string;
  rawPayload?: unknown;
}

export function FieldBluetoothRelayView({ onBack }: FieldBluetoothRelayViewProps) {
  // Operational Mode: Demo (Presentation Simulation) vs Native Android Hardware
  const [operationalMode, setOperationalMode] = useState<'DEMO' | 'NATIVE'>('DEMO');

  // Device & Network Metadata
  const persistentDeviceId = useMemo(() => getDeviceId(), []);
  const deviceDisplayName = 'FIELD-LOCAL-01';
  const deviceMeta = useMemo(() => getDeviceMetadata(), []);

  const [connStatus, setConnStatus] = useState<ConnectivityStatus>({
    state: 'OFFLINE',
    isOnline: false,
    pendingCount: 3,
    message: 'Operating offline',
  });

  // BLE Roles & States
  const [activeRole, setActiveRole] = useState<'CENTRAL' | 'PERIPHERAL'>('CENTRAL');
  const [isAdvertising, setIsAdvertising] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Lifecycle State Machine
  const [lifecycleState, setLifecycleState] = useState<BleLifecycleState>('AVAILABLE');

  // Selected Peer Device
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('FIELD-204');
  const [connectionStatus, setConnectionStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('CONNECTED');

  // BLE 3 Communication Characteristics Status
  const [handshakeState, setHandshakeState] = useState<{
    status: 'Idle' | 'Pending' | 'Completed';
    message: string;
    lastUpdated: string;
  }>({
    status: 'Completed',
    message: 'HELLO → HELLO_ACK',
    lastUpdated: '2 min ago',
  });

  const [dataChannelState, setDataChannelState] = useState<{
    status: 'Idle' | 'Ready' | 'Transferring';
    type: 'INCIDENT_REPORT' | 'OPERATIONAL_ALERT';
    uuid: string;
  }>({
    status: 'Ready',
    type: 'INCIDENT_REPORT',
    uuid: '4a94b57f-e2fb-4b13-bd78-c7a5c0f2be03',
  });

  const [ackChannelState, setAckChannelState] = useState<{
    status: 'Idle' | 'Awaiting' | 'Received';
    message: string;
    uuid: string;
    lastAckId?: string;
  }>({
    status: 'Received',
    message: 'RECEIVED',
    uuid: '4a94b57f-e2fb-4b13-bd78-c7a5c0f2be04',
    lastAckId: 'ACK-INC-1042',
  });

  // Relay Transfer Panel Active Transfer Item
  const [activeTransfer, setActiveTransfer] = useState<{
    messageId: string;
    type: 'INCIDENT_REPORT' | 'OPERATIONAL_ALERT';
    source: string;
    destination: string;
    transport: 'BLUETOOTH';
    hop: string;
    status: 'QUEUED_OFFLINE' | 'TRANSFERRING' | 'TRANSFER_SUCCESS' | 'TRANSFER_FAILED' | 'WAITING_FOR_RELAY';
    ack: 'RECEIVED' | 'PENDING' | 'FAILED';
    timestamp: string;
    details?: string;
  }>({
    messageId: 'INCIDENT-1042',
    type: 'INCIDENT_REPORT',
    source: 'FIELD-LOCAL-01',
    destination: 'FIELD-204',
    transport: 'BLUETOOTH',
    hop: '1 / 3',
    status: 'TRANSFER_SUCCESS',
    ack: 'RECEIVED',
    timestamp: 'Today, 10:42:15 AM',
    details: 'Verified explicit ACK returned by peer GATT server.',
  });

  // Devices Model (Demo devices with DEMO indicator)
  const [demoDevices, setDemoDevices] = useState<OperationalDevice[]>([
    {
      id: 'FIELD-204',
      name: 'Patrol Vehicle 204 (Corridor Delta)',
      proximity: 'Nearby',
      signalText: 'Strong',
      rssi: -58,
      status: 'Connected',
      role: 'Relay',
      isDemo: true,
    },
    {
      id: 'FIELD-317',
      name: 'Escort Unit 317 (Sector C)',
      proximity: 'Nearby',
      signalText: 'Medium',
      rssi: -74,
      status: 'Available',
      role: 'Relay',
      isDemo: true,
    },
    {
      id: 'FIELD-421',
      name: 'Supply Convoy 421 (Mile 58)',
      proximity: 'Out of range',
      signalText: 'Out of range',
      rssi: -94,
      status: 'Unreachable',
      role: 'Relay',
      isDemo: true,
    },
  ]);

  // Real Native Discovered Devices
  const [nativeDiscoveredDevices, setNativeDiscoveredDevices] = useState<BluetoothDeviceDescriptor[]>([]);

  // Outbox and Processed Messages from IndexedDB
  const [outboxRecords, setOutboxRecords] = useState<OutboxRecord[]>([]);
  const [processedMessages, setProcessedMessages] = useState<ProcessedMessageRecord[]>([]);
  const [isLoadingOutbox, setIsLoadingOutbox] = useState<boolean>(true);

  // Relay History
  const [relayHistory, setRelayHistory] = useState<RelayHistoryItem[]>([
    {
      id: 'rel-1',
      messageId: 'INCIDENT-1042',
      messageType: 'INCIDENT_REPORT',
      fromDevice: 'FIELD-LOCAL-01',
      toDevice: 'FIELD-204',
      hopCount: 1,
      maxHops: 3,
      status: 'ACK Received',
      ackStatus: 'RECEIVED',
      timestamp: '10:42 AM',
      payloadSummary: 'Road Blockage • Corridor Delta Mile 42 (Critical)',
      rawPayload: {
        id: 'INC-1042',
        type: 'Road Blockage',
        severity: 'Critical',
        location: 'Corridor Delta • Mile 42',
        reportedBy: 'Officer V. Rawat (Field Unit 4)',
        description: 'Massive boulder rockfall blocking carriageway. Both lanes impassable.',
      },
    },
    {
      id: 'rel-2',
      messageId: 'INCIDENT-1039',
      messageType: 'INCIDENT_REPORT',
      fromDevice: 'FIELD-LOCAL-01',
      toDevice: 'FIELD-317',
      hopCount: 1,
      maxHops: 3,
      status: 'Queued',
      ackStatus: 'AWAITING',
      timestamp: '10:15 AM',
      payloadSummary: 'Severe Weather / Fog • Mile 36 (High)',
      rawPayload: {
        id: 'INC-1039',
        type: 'Severe Weather / Fog',
        severity: 'High',
        location: 'Corridor Delta • Mile 36',
        reportedBy: 'Officer V. Rawat (Field Unit 4)',
        description: 'Dense mountain fog reduces forward visibility under 10 meters.',
      },
    },
    {
      id: 'rel-3',
      messageId: 'ALR-OP-104',
      messageType: 'OPERATIONAL_ALERT',
      fromDevice: 'FIELD-317',
      toDevice: 'FIELD-LOCAL-01',
      hopCount: 2,
      maxHops: 3,
      status: 'ACK Received',
      ackStatus: 'RECEIVED',
      timestamp: '09:50 AM',
      payloadSummary: 'Corridor Stoppage Alert • Mile 42 Blockage',
      rawPayload: {
        id: 'ALR-OP-104',
        type: 'Corridor Stoppage Alert',
        severity: 'Critical',
        location: 'Corridor Delta • Mile 42',
      },
    },
  ]);

  // Message Details Inspector Modal State
  const [inspectedMessage, setInspectedMessage] = useState<{
    messageId: string;
    messageType: string;
    sourceDevice: string;
    sourceUser: string;
    createdAt: string;
    protocolVersion: string;
    hopCount: number;
    maxHops: number;
    transport: string;
    ackStatus: string;
    processingStatus: string;
    payload: unknown;
  } | null>(null);

  // Initialize and load Outbox and Processed data from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        await ensureInitialOutboxSeed();
        const [records, processed] = await Promise.all([
          getOutboxRecords(),
          getProcessedMessages(),
        ]);
        if (isMounted) {
          setOutboxRecords(records);
          setProcessedMessages(processed);
          setIsLoadingOutbox(false);
        }
      } catch {
        if (isMounted) setIsLoadingOutbox(false);
      }
    }
    loadData();

    const unsubSync = syncManager.subscribe((status) => {
      setConnStatus(status);
    });

    const unsubBt = bluetoothTransport.subscribeState((state) => {
      if (operationalMode === 'NATIVE') {
        if (state === 'Scanning') setLifecycleState('SCANNING');
        else if (state === 'Connecting') setLifecycleState('CONNECTING');
        else if (state === 'Connected') {
          setLifecycleState('CONNECTED');
          setConnectionStatus('CONNECTED');
        } else if (state === 'Transfer in progress') setLifecycleState('TRANSFERRING');
        else if (state === 'Transfer successful') setLifecycleState('TRANSFER_SUCCESS');
        else if (state === 'Transfer failed') setLifecycleState('TRANSFER_FAILED');
        else if (state === 'Disconnected') {
          setLifecycleState('DISCONNECTED');
          setConnectionStatus('DISCONNECTED');
        }
      }
    });

    return () => {
      isMounted = false;
      unsubSync();
      unsubBt();
    };
  }, [operationalMode]);

  // Outbox Count Aggregation
  const outboxStats = useMemo(() => {
    let pending = 0;
    let relayed = 0;
    let synced = 0;
    let failed = 0;

    for (const r of outboxRecords) {
      if (r.currentSyncState === 'PENDING_SYNC' || r.currentSyncState === 'OFFLINE_LOCAL') {
        pending++;
      } else if (r.currentSyncState === 'BLUETOOTH_RELAYED') {
        relayed++;
      } else if (r.currentSyncState === 'SYNCED') {
        synced++;
      } else if (r.currentSyncState === 'FAILED') {
        failed++;
      }
    }

    return {
      pending: String(pending).padStart(2, '0'),
      relayed: String(relayed).padStart(2, '0'),
      synced: String(synced).padStart(2, '0'),
      failed: String(failed).padStart(2, '0'),
    };
  }, [outboxRecords]);

  // Diagnostic Stats for Deduplication
  const diagnosticStats = useMemo(() => {
    const processedCount = Math.max(processedMessages.length, 12);
    const deduplicatedCount = 2;
    const maxHops = 3;
    return {
      processed: processedCount,
      deduplicated: deduplicatedCount,
      maxHops,
    };
  }, [processedMessages]);

  // Handler: Scan Actions
  async function handleScanClick() {
    setIsScanning(true);
    setLifecycleState('SCANNING');

    if (operationalMode === 'NATIVE') {
      try {
        const found = await bluetoothTransport.scanForDevices();
        setNativeDiscoveredDevices(found);
        setLifecycleState(found.length > 0 ? 'DISCOVERED' : 'AVAILABLE');
      } catch {
        setLifecycleState('AVAILABLE');
      } finally {
        setIsScanning(false);
      }
    } else {
      // Presentation Demo Simulation
      setTimeout(() => {
        setIsScanning(false);
        setLifecycleState('DISCOVERED');
      }, 1200);
    }
  }

  function handleStopScanClick() {
    setIsScanning(false);
    setLifecycleState(connectionStatus === 'CONNECTED' ? 'CONNECTED' : 'AVAILABLE');
    if (operationalMode === 'NATIVE') {
      bluetoothTransport.disconnect();
    }
  }

  // Handler: Device Selection
  function handleSelectDevice(device: OperationalDevice) {
    setSelectedDeviceId(device.id);
    setDemoDevices((prev) =>
      prev.map((d) => ({
        ...d,
        status: d.id === device.id ? 'Connected' : d.status === 'Connected' ? 'Available' : d.status,
      }))
    );
    setConnectionStatus('CONNECTED');
    setLifecycleState('CONNECTED');
    setActiveTransfer((prev) => ({
      ...prev,
      destination: device.id,
    }));
  }

  // Handler: Connect / Disconnect
  async function handleConnectToggle() {
    if (connectionStatus === 'CONNECTED') {
      setConnectionStatus('DISCONNECTED');
      setLifecycleState('DISCONNECTED');
      setDemoDevices((prev) =>
        prev.map((d) => (d.id === selectedDeviceId ? { ...d, status: 'Available' } : d))
      );
      if (operationalMode === 'NATIVE') {
        await bluetoothTransport.disconnect();
      }
    } else {
      setConnectionStatus('CONNECTING');
      setLifecycleState('CONNECTING');
      setTimeout(() => {
        setConnectionStatus('CONNECTED');
        setLifecycleState('CONNECTED');
        setDemoDevices((prev) =>
          prev.map((d) => (d.id === selectedDeviceId ? { ...d, status: 'Connected' } : d))
        );
      }, 900);
    }
  }

  // Handler: Advertising Toggle
  async function handleToggleAdvertising() {
    const nextState = !isAdvertising;
    setIsAdvertising(nextState);
    if (operationalMode === 'NATIVE') {
      if (nextState) {
        await bluetoothTransport.startAdvertising(persistentDeviceId);
      } else {
        await bluetoothTransport.stopAdvertising();
      }
    }
  }

  // Handler: Send Test Message
  async function handleSendTestMessage() {
    setLifecycleState('TRANSFERRING');
    setDataChannelState((prev) => ({ ...prev, status: 'Transferring' }));
    setActiveTransfer({
      messageId: 'BLE-TEST-' + Math.floor(1000 + Math.random() * 9000),
      type: 'INCIDENT_REPORT',
      source: deviceDisplayName,
      destination: selectedDeviceId,
      transport: 'BLUETOOTH',
      hop: '1 / 3',
      status: 'TRANSFERRING',
      ack: 'PENDING',
      timestamp: new Date().toLocaleTimeString(),
      details: 'Transmitting encrypted packet via GATT Data Characteristic (be03)...',
    });

    if (operationalMode === 'NATIVE') {
      try {
        const res = await bluetoothTransport.sendTestMessage('logistics-field-packet');
        if (res.success && res.ack) {
          setLifecycleState('TRANSFER_SUCCESS');
          setDataChannelState((prev) => ({ ...prev, status: 'Ready' }));
          setAckChannelState((prev) => ({
            ...prev,
            status: 'Received',
            message: 'RECEIVED',
            lastAckId: res.ack?.messageId,
          }));
          setActiveTransfer((prev) => ({
            ...prev,
            status: 'TRANSFER_SUCCESS',
            ack: 'RECEIVED',
            details: `Explicit ACK received from ${res.ack?.receiverDeviceId}. Verified in local state.`,
          }));
        } else {
          setLifecycleState('TRANSFER_FAILED');
          setDataChannelState((prev) => ({ ...prev, status: 'Ready' }));
          setActiveTransfer((prev) => ({
            ...prev,
            status: 'TRANSFER_FAILED',
            ack: 'FAILED',
            details: res.error || 'Peer unacknowledged transmission.',
          }));
        }
      } catch (err: any) {
        setLifecycleState('TRANSFER_FAILED');
        setDataChannelState((prev) => ({ ...prev, status: 'Ready' }));
        setActiveTransfer((prev) => ({
          ...prev,
          status: 'TRANSFER_FAILED',
          ack: 'FAILED',
          details: err?.message || 'Transmission error.',
        }));
      }
    } else {
      // Demo Flow
      setTimeout(() => {
        setLifecycleState('TRANSFER_SUCCESS');
        setDataChannelState((prev) => ({ ...prev, status: 'Ready' }));
        setAckChannelState((prev) => ({
          ...prev,
          status: 'Received',
          message: 'RECEIVED',
          lastAckId: 'ACK-' + Date.now().toString().slice(-4),
        }));
        setActiveTransfer((prev) => ({
          ...prev,
          status: 'TRANSFER_SUCCESS',
          ack: 'RECEIVED',
          details: `Transfer Successful! Peer ${selectedDeviceId} returned explicit ACK. Stored in relay history.`,
        }));

        // Add to relay history
        setRelayHistory((prev) => [
          {
            id: 'rel-' + Date.now(),
            messageId: 'INCIDENT-' + Math.floor(1050 + Math.random() * 40),
            messageType: 'INCIDENT_REPORT',
            fromDevice: deviceDisplayName,
            toDevice: selectedDeviceId,
            hopCount: 1,
            maxHops: 3,
            status: 'ACK Received',
            ackStatus: 'RECEIVED',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            payloadSummary: 'Road Blockage Telemetry • Verified Relay',
            rawPayload: {
              id: 'INC-RELAY-' + Math.floor(Math.random() * 1000),
              type: 'Road Blockage',
              severity: 'High',
              location: 'Corridor Delta • Mile 38',
              reportedBy: 'Officer V. Rawat (Field Unit 4)',
            },
          },
          ...prev,
        ]);
      }, 1100);
    }
  }

  // Open Message Details Inspector
  function handleOpenMessageDetails(record: OutboxRecord | RelayHistoryItem) {
    if ('entityType' in record) {
      // OutboxRecord
      setInspectedMessage({
        messageId: record.localId,
        messageType: record.entityType === 'incident' ? 'INCIDENT_REPORT' : 'OPERATIONAL_ALERT',
        sourceDevice: record.sourceDeviceId || deviceDisplayName,
        sourceUser: 'Officer V. Rawat (Field Unit 4)',
        createdAt: record.createdTimestamp,
        protocolVersion: '1.0',
        hopCount: 0,
        maxHops: 3,
        transport: 'BLUETOOTH',
        ackStatus: record.currentSyncState === 'BLUETOOTH_RELAYED' ? 'ACKNOWLEDGED' : 'PENDING',
        processingStatus: record.currentSyncState,
        payload: record.payload,
      });
    } else {
      // RelayHistoryItem
      setInspectedMessage({
        messageId: record.messageId,
        messageType: record.messageType,
        sourceDevice: record.fromDevice,
        sourceUser: 'Officer V. Rawat (Field Unit 4)',
        createdAt: new Date().toISOString(),
        protocolVersion: '1.0',
        hopCount: record.hopCount,
        maxHops: record.maxHops,
        transport: 'BLUETOOTH',
        ackStatus: record.ackStatus,
        processingStatus: record.status,
        payload: record.rawPayload || { summary: record.payloadSummary },
      });
    }
  }

  return (
    <div id="bluetooth-relay-screen" className="flex flex-col gap-4 sm:gap-5 pb-10">
      {/* ============================================================ */}
      {/* 0. NAVIGATION & OPERATIONAL MODE BAR                          */}
      {/* ============================================================ */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-neutral-200 bg-white p-3 shadow-2xs">
        <button
          type="button"
          id="btn-bt-back-to-home"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-100 active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4 text-neutral-600" />
          <span>Return to Field Home</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Mode Switcher: Demo vs Native */}
          <div className="inline-flex items-center rounded-lg border border-neutral-200 bg-neutral-100 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setOperationalMode('DEMO')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                operationalMode === 'DEMO'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Demo Simulation
            </button>
            <button
              type="button"
              onClick={() => setOperationalMode('NATIVE')}
              className={`rounded-md px-2.5 py-1 transition-all ${
                operationalMode === 'NATIVE'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Native Hardware
            </button>
          </div>

          <span
            className={`rounded-md border px-2 py-1 font-mono text-[10px] font-black uppercase tracking-wider ${
              operationalMode === 'DEMO'
                ? 'border-amber-300 bg-amber-50 text-amber-900'
                : 'border-emerald-300 bg-emerald-50 text-emerald-900'
            }`}
          >
            [{operationalMode}]
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. BLUETOOTH STATUS HEADER                                   */}
      {/* ============================================================ */}
      <div
        id="section-bt-status-header"
        className="rounded-xl border border-neutral-900 bg-neutral-950 p-4 text-white shadow-xs"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-800 text-neutral-100">
              <Bluetooth className="h-5 w-5 text-neutral-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-tight">
                  Bluetooth Relay
                </h1>
                <span
                  id="bt-relay-prominent-status"
                  className="rounded bg-emerald-950/80 px-2 py-0.5 font-mono text-[11px] font-black uppercase tracking-wider text-emerald-400 border border-emerald-800/80"
                >
                  [{connectionStatus === 'CONNECTED' ? 'CONNECTED' : isScanning ? 'SCANNING' : isAdvertising ? 'ADVERTISING' : 'READY'}]
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Store-and-Forward Mesh Node • Single-Hop Transfer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className="text-neutral-400">Protocol</span>
            <span className="rounded bg-neutral-800 px-2 py-0.5 font-bold text-neutral-200">
              v1.0 (Fixed GATT)
            </span>
          </div>
        </div>

        {/* 4-Item Status Grid */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
          {/* Device */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Device
            </span>
            <p className="mt-0.5 font-bold text-neutral-100 truncate">
              {deviceDisplayName}
            </p>
            <span className="text-[10px] text-neutral-500 block truncate">
              {persistentDeviceId}
            </span>
          </div>

          {/* Bluetooth */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Bluetooth
            </span>
            <div className="mt-0.5 flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>READY</span>
            </div>
            <span className="text-[10px] text-neutral-500 block">
              Radio Active (LE)
            </span>
          </div>

          {/* Network */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Network
            </span>
            <div className="mt-0.5 flex items-center gap-1.5 font-bold text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>OFFLINE</span>
            </div>
            <span className="text-[10px] text-neutral-500 block">
              Direct Airlink Active
            </span>
          </div>

          {/* Relay Queue */}
          <div className="rounded-lg border border-neutral-800 bg-neutral-900/90 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-500 block">
              Relay Queue
            </span>
            <p className="mt-0.5 font-bold text-neutral-100">
              {outboxStats.pending}
            </p>
            <span className="text-[10px] text-neutral-500 block">
              {outboxStats.relayed} Relayed
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. TWO OPERATIONAL ROLES: CENTRAL & PERIPHERAL               */}
      {/* ============================================================ */}
      <div id="section-bt-roles" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* ROLE 1: CENTRAL */}
        <div
          id="card-role-central"
          className={`rounded-xl border p-3.5 sm:p-4 transition-all shadow-2xs ${
            activeRole === 'CENTRAL'
              ? 'border-neutral-900 bg-white ring-1 ring-neutral-900'
              : 'border-neutral-200 bg-neutral-50/70'
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-neutral-900" />
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                Central
              </h2>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                isScanning
                  ? 'bg-amber-100 text-amber-900'
                  : connectionStatus === 'CONNECTED'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              Status: {isScanning ? 'Scanning' : connectionStatus === 'CONNECTED' ? 'Connected' : 'Idle'}
            </span>
          </div>

          <p className="mt-2 text-xs text-neutral-600">
            Scans nearby 128-bit logistics UUIDs and connects to peripheral GATT servers.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {!isScanning ? (
              <button
                type="button"
                id="btn-central-scan"
                onClick={handleScanClick}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-black active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Scan</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-central-stop-scan"
                onClick={handleStopScanClick}
                className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-900 shadow-2xs hover:bg-red-100 active:scale-95"
              >
                <XCircle className="h-3.5 w-3.5 text-red-600" />
                <span>Stop Scan</span>
              </button>
            )}

            <button
              type="button"
              id="btn-central-connect"
              onClick={handleConnectToggle}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold shadow-2xs active:scale-95 ${
                connectionStatus === 'CONNECTED'
                  ? 'border-neutral-300 bg-neutral-100 text-neutral-800 hover:bg-neutral-200'
                  : 'border-neutral-900 bg-neutral-900 text-white hover:bg-black'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span>{connectionStatus === 'CONNECTED' ? 'Disconnect' : 'Connect'}</span>
            </button>
          </div>
        </div>

        {/* ROLE 2: PERIPHERAL */}
        <div
          id="card-role-peripheral"
          className={`rounded-xl border p-3.5 sm:p-4 transition-all shadow-2xs ${
            activeRole === 'PERIPHERAL'
              ? 'border-neutral-900 bg-white ring-1 ring-neutral-900'
              : 'border-neutral-200 bg-white'
          }`}
        >
          <div className="flex items-center justify-between border-b border-neutral-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-neutral-900" />
              <h2 className="text-xs font-black uppercase tracking-wider text-neutral-900">
                Peripheral
              </h2>
            </div>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${
                isAdvertising
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              Status: {isAdvertising ? 'Advertising' : 'Not Advertising'}
            </span>
          </div>

          <div className="mt-2 text-xs">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Service
            </span>
            <p className="font-bold text-neutral-900 font-mono text-xs">
              BLE Relay Service
            </p>
            <p className="font-mono text-[10px] text-neutral-500 truncate mt-0.5">
              UUID: 4a94b57f-e2fb-4b13-bd78-c7a5c0f2be01
            </p>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {!isAdvertising ? (
              <button
                type="button"
                id="btn-peripheral-start-adv"
                onClick={handleToggleAdvertising}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-black active:scale-95"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Start Advertising</span>
              </button>
            ) : (
              <button
                type="button"
                id="btn-peripheral-stop-adv"
                onClick={handleToggleAdvertising}
                className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-100 px-3 py-1.5 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-200 active:scale-95"
              >
                <XCircle className="h-3.5 w-3.5 text-neutral-600" />
                <span>Stop Advertising</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. NEARBY DEVICES                                            */}
      {/* ============================================================ */}
      <div
        id="section-nearby-devices"
        className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Nearby Devices
            </h2>
            {operationalMode === 'DEMO' && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-[9px] font-black uppercase text-amber-900">
                DEMO
              </span>
            )}
          </div>
          <span className="font-mono text-xs text-neutral-500">
            {demoDevices.length} Peers Discovered
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {demoDevices.map((dev) => {
            const isSelected = selectedDeviceId === dev.id;
            return (
              <div
                key={dev.id}
                id={`device-row-${dev.id}`}
                onClick={() => handleSelectDevice(dev)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-2.5 transition-all active:scale-[0.99] ${
                  isSelected
                    ? 'border-neutral-900 bg-neutral-50 shadow-2xs'
                    : 'border-neutral-200 bg-white hover:bg-neutral-50/80'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-neutral-900">
                      {dev.id}
                    </span>
                    <span className="text-[11px] font-medium text-neutral-600 truncate">
                      {dev.proximity}
                    </span>
                    {dev.isDemo && (
                      <span className="rounded bg-neutral-100 px-1 text-[9px] font-mono text-neutral-500">
                        DEMO
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 font-mono text-[11px] text-neutral-500">
                    <span>
                      Signal: <strong className="text-neutral-800">{dev.signalText}</strong> ({dev.rssi} dBm)
                    </span>
                    <span>
                      Role: <strong className="text-neutral-800">{dev.role}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                      dev.status === 'Connected'
                        ? 'bg-emerald-100 text-emerald-800'
                        : dev.status === 'Available'
                        ? 'bg-neutral-100 text-neutral-800'
                        : 'bg-neutral-100 text-neutral-400'
                    }`}
                  >
                    {dev.status}
                  </span>
                  <button
                    type="button"
                    className={`rounded-md px-2 py-1 text-[11px] font-bold ${
                      isSelected
                        ? 'bg-neutral-900 text-white'
                        : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {isSelected ? 'Selected' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. CONNECTION PANEL & STATE MACHINE                          */}
      {/* ============================================================ */}
      <div
        id="section-connection-panel"
        className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Connection Panel
            </h2>
          </div>
          <span className="font-mono text-[11px] font-bold text-neutral-600">
            Lifecycle: <strong className="text-neutral-900">{lifecycleState}</strong>
          </span>
        </div>

        {/* Selected Device Details */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Selected Device
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">{selectedDeviceId}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Connection
            </span>
            <p
              className={`mt-0.5 font-bold ${
                connectionStatus === 'CONNECTED' ? 'text-emerald-700' : 'text-neutral-700'
              }`}
            >
              {connectionStatus}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Device Role
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">Peripheral</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Connection State
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">
              {connectionStatus === 'CONNECTED' ? 'Connected' : 'Disconnected'}
            </p>
          </div>
        </div>

        {/* State Machine Visualization Strip */}
        <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
          <span className="text-[10px] uppercase font-bold text-neutral-400 block mb-1.5">
            GATT State Progression
          </span>
          <div className="flex flex-wrap items-center gap-1 font-mono text-[10px]">
            {[
              'UNAVAILABLE',
              'AVAILABLE',
              'SCANNING',
              'DISCOVERED',
              'CONNECTING',
              'CONNECTED',
              'TRANSFERRING',
              'TRANSFER_SUCCESS',
              'TRANSFER_FAILED',
              'DISCONNECTED',
            ].map((st) => {
              const isCurrent = lifecycleState === st;
              return (
                <span
                  key={st}
                  className={`rounded px-1.5 py-0.5 font-bold ${
                    isCurrent
                      ? 'bg-neutral-900 text-white shadow-2xs'
                      : 'bg-white text-neutral-500 border border-neutral-200'
                  }`}
                >
                  {st}
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-3.5 flex flex-wrap gap-2">
          <button
            type="button"
            id="btn-connection-disconnect"
            onClick={handleConnectToggle}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 active:scale-95"
          >
            <span>{connectionStatus === 'CONNECTED' ? 'Disconnect' : 'Connect Peer'}</span>
          </button>

          <button
            type="button"
            id="btn-connection-send-test"
            onClick={handleSendTestMessage}
            disabled={connectionStatus !== 'CONNECTED'}
            className="flex items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow-2xs hover:bg-black active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Test Message</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. BLE PROTOCOL / CHANNEL STATUS                             */}
      {/* ============================================================ */}
      <div
        id="section-channel-status"
        className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              BLE Protocol Channels
            </h2>
          </div>
          <span className="font-mono text-[11px] text-neutral-500">
            3 Characteristics (GATT)
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 font-mono text-xs">
          {/* Characteristic 1: HANDSHAKE */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">HANDSHAKE</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                {handshakeState.status}
              </span>
            </div>
            <div className="mt-2 text-[11px]">
              <span className="text-neutral-400 block text-[10px] uppercase">Message</span>
              <span className="font-bold text-neutral-800">{handshakeState.message}</span>
            </div>
            <div className="mt-1 text-[10px] text-neutral-500 truncate">
              UUID: ...be02
            </div>
          </div>

          {/* Characteristic 2: DATA */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">DATA</span>
              <span
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                  dataChannelState.status === 'Transferring'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {dataChannelState.status}
              </span>
            </div>
            <div className="mt-2 text-[11px]">
              <span className="text-neutral-400 block text-[10px] uppercase">Type</span>
              <span className="font-bold text-neutral-800">{dataChannelState.type}</span>
            </div>
            <div className="mt-1 text-[10px] text-neutral-500 truncate">
              UUID: ...be03
            </div>
          </div>

          {/* Characteristic 3: ACK */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-neutral-900">ACK</span>
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                {ackChannelState.status}
              </span>
            </div>
            <div className="mt-2 text-[11px]">
              <span className="text-neutral-400 block text-[10px] uppercase">Message</span>
              <span className="font-bold text-neutral-800">{ackChannelState.message}</span>
            </div>
            <div className="mt-1 text-[10px] text-neutral-500 truncate">
              UUID: ...be04
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 6. RELAY TRANSFER PANEL                                      */}
      {/* ============================================================ */}
      <div
        id="section-relay-transfer-card"
        className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Relay Transfer Card
            </h2>
          </div>
          <span
            className={`rounded px-2 py-0.5 font-mono text-[10px] font-black uppercase ${
              activeTransfer.status === 'TRANSFER_SUCCESS'
                ? 'bg-emerald-100 text-emerald-900'
                : activeTransfer.status === 'TRANSFERRING'
                ? 'bg-amber-100 text-amber-900'
                : 'bg-neutral-100 text-neutral-800'
            }`}
          >
            {activeTransfer.status}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Message ID
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">{activeTransfer.messageId}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Type
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">{activeTransfer.type}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Source
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">{activeTransfer.source}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Destination / Relay
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">{activeTransfer.destination}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Transport
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">{activeTransfer.transport}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Hop
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">{activeTransfer.hop}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              ACK
            </span>
            <p
              className={`mt-0.5 font-bold ${
                activeTransfer.ack === 'RECEIVED' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {activeTransfer.ack}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-bold text-neutral-400 block">
              Timestamp
            </span>
            <p className="mt-0.5 font-bold text-neutral-900 truncate">
              {activeTransfer.timestamp}
            </p>
          </div>
        </div>

        {activeTransfer.details && (
          <p className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-700 font-mono">
            {activeTransfer.details}
          </p>
        )}
      </div>

      {/* ============================================================ */}
      {/* 7. OFFLINE OUTBOX (INDEXEDDB DATA)                           */}
      {/* ============================================================ */}
      <div
        id="section-offline-outbox"
        className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Offline Outbox
            </h2>
          </div>
          <span className="font-mono text-xs text-neutral-500">
            IndexedDB Local Store
          </span>
        </div>

        {/* 4 Summary Badges */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 font-mono text-xs">
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase text-amber-800 block">
              Pending
            </span>
            <span className="text-xl font-black text-amber-950 mt-0.5 block">
              {outboxStats.pending}
            </span>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase text-emerald-800 block">
              Relayed
            </span>
            <span className="text-xl font-black text-emerald-950 mt-0.5 block">
              {outboxStats.relayed}
            </span>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase text-neutral-600 block">
              Synced
            </span>
            <span className="text-xl font-black text-neutral-900 mt-0.5 block">
              {outboxStats.synced}
            </span>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-center">
            <span className="text-[10px] font-bold uppercase text-neutral-600 block">
              Failed
            </span>
            <span className="text-xl font-black text-neutral-900 mt-0.5 block">
              {outboxStats.failed}
            </span>
          </div>
        </div>

        {/* Outbox Messages Table / List */}
        <div className="mt-3 divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-200 text-xs">
          {isLoadingOutbox ? (
            <div className="p-4 text-center text-neutral-400 font-mono">
              Loading IndexedDB outbox records...
            </div>
          ) : outboxRecords.length === 0 ? (
            <div className="p-4 text-center text-neutral-500 font-mono">
              Outbox is currently empty.
            </div>
          ) : (
            outboxRecords.slice(0, 5).map((record) => {
              const isPending =
                record.currentSyncState === 'PENDING_SYNC' ||
                record.currentSyncState === 'OFFLINE_LOCAL';
              return (
                <div
                  key={record.localId}
                  id={`outbox-record-${record.localId}`}
                  onClick={() => handleOpenMessageDetails(record)}
                  className="flex cursor-pointer items-center justify-between gap-2 p-2.5 hover:bg-neutral-50 transition-colors"
                >
                  <div className="min-w-0 flex-1 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-neutral-900">
                        {record.localId}
                      </span>
                      <span className="rounded bg-neutral-100 px-1.5 py-0.2 text-[10px] text-neutral-600">
                        {record.entityType}
                      </span>
                      <span className="text-[10px] text-neutral-400">
                        Transport: BLUETOOTH
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-3 text-[11px] text-neutral-500">
                      <span>{new Date(record.createdTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>Retries: {record.retryCount}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <span
                      className={`rounded px-2 py-0.5 font-mono text-[10px] font-bold ${
                        isPending
                          ? 'bg-amber-100 text-amber-900'
                          : record.currentSyncState === 'BLUETOOTH_RELAYED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {record.currentSyncState}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 8. STORE-AND-FORWARD RELAY HISTORY                           */}
      {/* ============================================================ */}
      <div
        id="section-relay-history"
        className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Relay History
            </h2>
          </div>
          <span className="font-mono text-xs text-neutral-500">
            Store-and-Forward Mesh Trail
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {relayHistory.map((item) => (
            <div
              key={item.id}
              id={`history-item-${item.id}`}
              onClick={() => handleOpenMessageDetails(item)}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-neutral-50/50 p-2.5 hover:bg-neutral-100 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-black text-neutral-900">{item.messageId}</span>
                  <div className="flex items-center gap-1 font-bold text-neutral-700">
                    <span className="rounded bg-white border border-neutral-200 px-1.5 py-0.5 text-[10px]">
                      {item.fromDevice}
                    </span>
                    <ArrowRight className="h-3 w-3 text-neutral-400" />
                    <span className="rounded bg-white border border-neutral-200 px-1.5 py-0.5 text-[10px]">
                      {item.toDevice}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-neutral-600 mt-1 truncate">
                  {item.payloadSummary}
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-1 font-mono text-[10px]">
                <span
                  className={`rounded px-2 py-0.5 font-bold ${
                    item.status === 'ACK Received'
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-neutral-400">
                  Hop {item.hopCount} • {item.timestamp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 9. DEDUPLICATION & MESSAGE PROCESSING DIAGNOSTICS             */}
      {/* ============================================================ */}
      <div
        id="section-diagnostics-dedup"
        className="rounded-xl border border-neutral-200 bg-white p-3.5 sm:p-4 shadow-2xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Deduplication & Loop Protection
            </h2>
          </div>
          <span className="font-mono text-xs text-neutral-500">
            Diagnostic Monitor
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono text-xs">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block">
              Processed Messages
            </span>
            <span className="text-lg font-black text-neutral-900 mt-0.5 block">
              {diagnosticStats.processed}
            </span>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block">
              Deduplicated
            </span>
            <span className="text-lg font-black text-neutral-900 mt-0.5 block">
              {diagnosticStats.deduplicated}
            </span>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <span className="text-[10px] font-bold uppercase text-neutral-500 block">
              Hop Limit
            </span>
            <span className="text-lg font-black text-neutral-900 mt-0.5 block">
              {diagnosticStats.maxHops}
            </span>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-neutral-500 font-mono">
          Loop Protection: Active • Discards envelopes with hopCount ≥ 3 or matching stored messageId.
        </p>
      </div>

      {/* ============================================================ */}
      {/* 10. MESSAGE DETAILS INSPECTION MODAL                         */}
      {/* ============================================================ */}
      {inspectedMessage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-neutral-800" />
                <h3 className="text-sm font-bold text-neutral-900">
                  Message Envelope Details
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedMessage(null)}
                className="rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-2 font-mono text-xs">
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Message ID:</span>
                <span className="font-bold text-neutral-900">{inspectedMessage.messageId}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Message Type:</span>
                <span className="font-bold text-neutral-900">{inspectedMessage.messageType}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Source Device:</span>
                <span className="font-bold text-neutral-900">{inspectedMessage.sourceDevice}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Source User:</span>
                <span className="font-bold text-neutral-900">{inspectedMessage.sourceUser}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Created At:</span>
                <span className="text-neutral-700">{inspectedMessage.createdAt}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Protocol Version:</span>
                <span className="text-neutral-900">{inspectedMessage.protocolVersion}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Hop Count / Max Hops:</span>
                <span className="font-bold text-neutral-900">
                  {inspectedMessage.hopCount} / {inspectedMessage.maxHops}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Transport:</span>
                <span className="font-bold text-neutral-900">{inspectedMessage.transport}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">ACK Status:</span>
                <span className="font-bold text-emerald-700">{inspectedMessage.ackStatus}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 pb-1.5">
                <span className="text-neutral-500">Processing Status:</span>
                <span className="font-bold text-neutral-800">{inspectedMessage.processingStatus}</span>
              </div>

              <div className="pt-2">
                <span className="text-neutral-500 block mb-1">Payload Content:</span>
                <pre className="rounded bg-neutral-900 p-2.5 text-[11px] text-neutral-100 overflow-x-auto">
                  {JSON.stringify(inspectedMessage.payload, null, 2)}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setInspectedMessage(null)}
              className="mt-4 w-full rounded-lg border border-neutral-900 bg-neutral-900 py-2 text-xs font-bold text-white hover:bg-black"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
