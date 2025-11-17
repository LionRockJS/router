interface RouteResult {
    status: number;
    body: any;
    cookies?: any;
    headers?: Record<string, string>;
}
interface RouteInfo {
    path: string;
    method: string;
}
export default class Route {
    static handler(result: RouteResult, response: any): Promise<void>;
    static addRoute(app: any, route: RouteInfo, callback: Function): any;
}
export {};
