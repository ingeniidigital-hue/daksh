import { randomUUID } from "crypto";
import {
  SuperRegion,
  SUPER_REGIONS,
  CloudDeployment,
  AgonesServerInstance,
  FailoverResult
} from "./types";
import { routeNearestPoP } from "./routing";

interface DatabaseClusterState {
  primaryNodeId: string;
  standbyNodeId: string;
  data: Map<string, any>;
  replicationLog: Array<{ key: string; value: any; timestamp: number }>;
}

interface CloudStore {
  deployments: Map<string, CloudDeployment>;
  servers: Map<string, AgonesServerInstance>;
  dbClusters: Map<string, DatabaseClusterState>;
}

const globalStore: CloudStore = {
  deployments: new Map(),
  servers: new Map(),
  dbClusters: new Map()
};

const REGION_IPS: Record<SuperRegion, string> = {
  bom: "13.232.45.10",
  fra: "18.194.20.55",
  iad: "52.90.110.84",
  nrt: "54.249.80.12",
  gru: "177.71.180.99"
};

export function resetCloudStorage(): void {
  globalStore.deployments.clear();
  globalStore.servers.clear();
  globalStore.dbClusters.clear();
}

export class CloudPlatformService {
  static routeNearestPoP = routeNearestPoP;

  static async deployGlobalCloud(
    titleId: string,
    options: { regions?: SuperRegion[]; tier?: string } = {}
  ): Promise<CloudDeployment> {
    const targetRegions = options.regions || (Object.keys(SUPER_REGIONS) as SuperRegion[]);

    const deployment: CloudDeployment = {
      titleId,
      status: "HEALTHY",
      provisionedRegions: targetRegions,
      uptimeSla: "99.99%",
      tier: options.tier || "studio_cloud",
      activeCcu: 1240,
      avgTickrateHz: 60.0,
      deployedAt: Date.now()
    };

    globalStore.deployments.set(titleId, deployment);

    // Seed initial warm Agones fleets in each provisioned region
    for (const region of targetRegions) {
      await this.seedWarmFleet(titleId, region, 2);
    }

    // Initialize Multi-AZ database cluster
    await this.initializeDatabaseCluster(titleId);

    return deployment;
  }

  static async getDeployment(titleId: string): Promise<CloudDeployment | null> {
    return globalStore.deployments.get(titleId) || null;
  }

  static async seedWarmFleet(
    titleId: string,
    region: SuperRegion,
    count: number = 2
  ): Promise<AgonesServerInstance[]> {
    const created: AgonesServerInstance[] = [];
    const baseIp = REGION_IPS[region] || "127.0.0.1";

    for (let i = 0; i < count; i++) {
      const serverId = `dgs_${region}_${randomUUID().slice(0, 8)}`;
      const server: AgonesServerInstance = {
        serverId,
        titleId,
        region,
        ip: baseIp,
        port: 7000 + Math.floor(Math.random() * 1000),
        status: "READY",
        gameMode: "standard"
      };
      globalStore.servers.set(serverId, server);
      created.push(server);
    }
    return created;
  }

  static async allocateGameServer(params: {
    titleId: string;
    region: SuperRegion;
    gameMode?: string;
  }): Promise<AgonesServerInstance> {
    const { titleId, region, gameMode = "standard" } = params;

    // 1. Look for existing warm READY instance in this region
    const warmInstance = Array.from(globalStore.servers.values()).find(
      s => s.titleId === titleId && s.region === region && s.status === "READY"
    );

    if (warmInstance) {
      warmInstance.status = "ALLOCATED";
      warmInstance.gameMode = gameMode;
      warmInstance.allocatedAt = Date.now();
      globalStore.servers.set(warmInstance.serverId, warmInstance);
      return warmInstance;
    }

    // 2. Fast-spawn new container on warm host (<200ms)
    const baseIp = REGION_IPS[region] || "127.0.0.1";
    const server: AgonesServerInstance = {
      serverId: `dgs_${region}_${randomUUID().slice(0, 8)}`,
      titleId,
      region,
      ip: baseIp,
      port: 7000 + Math.floor(Math.random() * 1000),
      status: "ALLOCATED",
      gameMode,
      allocatedAt: Date.now()
    };
    globalStore.servers.set(server.serverId, server);
    return server;
  }

  static async listGameServers(
    titleId: string,
    region?: SuperRegion
  ): Promise<AgonesServerInstance[]> {
    return Array.from(globalStore.servers.values()).filter(
      s => s.titleId === titleId && (!region || s.region === region)
    );
  }

  // --- Database Multi-AZ HA & Automated Failover ---
  static async initializeDatabaseCluster(titleId: string): Promise<DatabaseClusterState> {
    const cluster: DatabaseClusterState = {
      primaryNodeId: `pg_node_primary_az1`,
      standbyNodeId: `pg_node_standby_az2`,
      data: new Map(),
      replicationLog: []
    };
    globalStore.dbClusters.set(titleId, cluster);
    return cluster;
  }

  static async writeRecord(titleId: string, key: string, value: any): Promise<void> {
    let cluster = globalStore.dbClusters.get(titleId);
    if (!cluster) {
      cluster = await this.initializeDatabaseCluster(titleId);
    }
    cluster.data.set(key, value);
    cluster.replicationLog.push({ key, value, timestamp: Date.now() });
  }

  static async readRecord(titleId: string, key: string): Promise<any> {
    const cluster = globalStore.dbClusters.get(titleId);
    if (!cluster) return null;
    return cluster.data.get(key) || null;
  }

  static async simulatePrimaryCrashAndFailover(titleId: string): Promise<FailoverResult> {
    const cluster = globalStore.dbClusters.get(titleId);
    if (!cluster) {
      throw new Error("No database cluster found for failover");
    }

    const crashedPrimary = cluster.primaryNodeId;
    const promotedStandby = cluster.standbyNodeId;

    // Reassign roles: standby promoted to new primary
    cluster.primaryNodeId = promotedStandby;
    cluster.standbyNodeId = `pg_node_standby_az3_spawned`;

    return {
      failoverSuccess: true,
      promotedReplica: promotedStandby,
      uncommittedDataLoss: 0
    };
  }
}
