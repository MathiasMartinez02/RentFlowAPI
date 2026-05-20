export interface IMaintenanceStats {
  ticketsAbiertos: number;
  ticketsUrgentes: number;
  ticketsResueltos: number;
  tiempoPromedioResolucion: number | null;
  costosTotales: number;
}
