export interface Command {
    id: number;
    weight: number;
    status: "WAITING" | "PENDING" | "FINISH";
    commandDate: string;
    deliveryDate: string | null;
    articleIds: number[];
    truckIds: number[];
    clientIds: number[];
    userId: number;
}