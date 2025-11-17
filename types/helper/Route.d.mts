import { Controller } from '@lionrockjs/central';
type ControllerClass = typeof Controller;
declare const _default: {
    execute_debug: (ControllerParam: ControllerClass, request: any) => Promise<any>;
    execute_production: (ControllerParam: ControllerClass, request: any) => Promise<any>;
};
export default _default;
