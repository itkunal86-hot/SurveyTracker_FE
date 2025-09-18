import { PipelineSegment, LegacyPipelineSegment, Coordinates } from './api';

/**
 * Utility functions to provide backward compatibility for pipeline components
 * These getters allow existing components to access properties from the new enhanced data model
 */

export class PipelineAdapter {
  private pipeline: PipelineSegment;

  constructor(pipeline: PipelineSegment) {
    this.pipeline = pipeline;
  }

  // Legacy property getters for backward compatibility
  get diameter(): number {
    return this.pipeline.specifications.diameter.value;
  }

  get material(): "STEEL" | "HDPE" | "PVC" | "CONCRETE" {
    const material = this.pipeline.specifications.material;
    // Map new materials to legacy ones
    switch (material) {
      case "CAST_IRON":
      case "COPPER":
      case "POLYETHYLENE":
      case "OTHER":
        return "STEEL"; // Default mapping for unsupported legacy materials
      default:
        return material as "STEEL" | "HDPE" | "PVC" | "CONCRETE";
    }
  }

  get depth(): number | undefined {
    return this.pipeline.installation.depth?.value;
  }

  get pressure(): number {
    return this.pipeline.operatingPressure.nominal;
  }

  get installDate(): string | undefined {
    return this.pipeline.installation.commissioningDate;
  }

  get coordinates(): Coordinates[] {
    return this.pipeline.coordinates.map(coord => ({
      lat: coord.lat,
      lng: coord.lng,
      elevation: coord.elevation
    }));
  }

  // Extended property getters for enhanced functionality
  get specifications() {
    return this.pipeline.specifications;
  }

  get operatingPressure() {
    return this.pipeline.operatingPressure;
  }

  get installation() {
    return this.pipeline.installation;
  }

  get consumerCategory() {
    return this.pipeline.consumerCategory;
  }

  get elevationProfile() {
    return this.pipeline.elevationProfile;
  }

  get maintenanceHistory() {
    return this.pipeline.maintenanceHistory;
  }

  get flowRate() {
    return this.pipeline.flowRate;
  }

  get connectedValves() {
    return this.pipeline.connectedValves;
  }

  get connectedDevices() {
    return this.pipeline.connectedDevices;
  }

  get drawings() {
    return this.pipeline.drawings;
  }

  get standards() {
    return this.pipeline.standards;
  }

  get certifications() {
    return this.pipeline.certifications;
  }

  // Convert to legacy format
  toLegacy(): LegacyPipelineSegment {
    return {
      id: this.pipeline.id,
      name: this.pipeline.name,
      diameter: this.diameter,
      material: this.material,
      depth: this.depth,
      pressure: this.pressure,
      installDate: this.installDate,
      coordinates: this.coordinates,
      status: this.pipeline.status
    };
  }

  // Static method to create adapter from pipeline
  static from(pipeline: PipelineSegment): PipelineAdapter {
    return new PipelineAdapter(pipeline);
  }
}

// Utility function to extend pipeline objects with legacy properties
export function withLegacyProperties(pipeline: PipelineSegment): PipelineSegment & LegacyPipelineSegment {
  const adapter = new PipelineAdapter(pipeline);
  
  return {
    ...pipeline,
    diameter: adapter.diameter,
    material: adapter.material,
    depth: adapter.depth,
    pressure: adapter.pressure,
    installDate: adapter.installDate,
    coordinates: adapter.coordinates
  } as PipelineSegment & LegacyPipelineSegment;
}

// Utility function to convert array of pipelines to legacy format
export function toLegacyPipelines(pipelines: PipelineSegment[]): LegacyPipelineSegment[] {
  return pipelines.map(p => PipelineAdapter.from(p).toLegacy());
}

// Utility function to get legacy-compatible pipeline list with extended properties
export function extendPipelines(pipelines: PipelineSegment[]): (PipelineSegment & LegacyPipelineSegment)[] {
  return pipelines.map(withLegacyProperties);
}

export default PipelineAdapter;