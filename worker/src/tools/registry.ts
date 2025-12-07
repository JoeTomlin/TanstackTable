export class ToolRegistry {
    private tools = new Map<string, Function>();
    
    register(name: string, fn: Function) {
      this.tools.set(name, fn);
    }
    
    get(name: string): Function | undefined {
      return this.tools.get(name);
    }
  }