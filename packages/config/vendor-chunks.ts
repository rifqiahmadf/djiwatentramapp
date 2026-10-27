/** Keep static dependency cycles together and bound vendor chunks by source size. */
type ModuleInfo = { code?: string | null; importedIds: readonly string[]; isIncluded?: boolean | null };
type ModuleGraph = { getModuleIds(): IterableIterator<string>; getModuleInfo(id: string): ModuleInfo | null };
export function createVendorChunks(sourceBudget = 350_000) {
  let assignments: Map<string, string> | undefined;
  return (id: string, graph: ModuleGraph): string | undefined => {
    if (!assignments) {
      const all = new Map([...graph.getModuleIds()].sort().flatMap((name) => {
        const info = graph.getModuleInfo(name);
        return info ? [[name, info] as const] : [];
      }));
      // Include generated CommonJS helpers and every static vendor dependency;
      // leaving a helper in the entry chunk introduces a vendor -> entry cycle.
      const modules = new Map<string, ModuleInfo>();
      const include = (name: string) => {
        const info = all.get(name);
        if (!info || modules.has(name)) return;
        modules.set(name, info);
        for (const dependency of info.importedIds) include(dependency);
      };
      for (const name of all.keys()) if (name.includes("/node_modules/")) include(name);
      const indexes = new Map<string, number>();
      const low = new Map<string, number>();
      const stack: string[] = [];
      const active = new Set<string>();
      const components: string[][] = [];
      let next = 0;
      const visit = (name: string) => {
        indexes.set(name, next); low.set(name, next++); stack.push(name); active.add(name);
        for (const dependency of modules.get(name)!.importedIds) {
          if (!modules.has(dependency)) continue;
          if (!indexes.has(dependency)) { visit(dependency); low.set(name, Math.min(low.get(name)!, low.get(dependency)!)); }
          else if (active.has(dependency)) low.set(name, Math.min(low.get(name)!, indexes.get(dependency)!));
        }
        if (low.get(name) === indexes.get(name)) {
          const component: string[] = [];
          let member: string;
          do { member = stack.pop()!; active.delete(member); component.push(member); } while (member !== name);
          components.push(component);
        }
      };
      for (const name of modules.keys()) if (!indexes.has(name)) visit(name);
      // Tarjan emits dependency components first; contiguous packing preserves that order.
      assignments = new Map();
      let chunk = 1, size = 0;
      for (const component of components) {
        const bytes = component.reduce((sum, name) => sum + (modules.get(name)!.isIncluded === false ? 0 : Buffer.byteLength(modules.get(name)!.code ?? "")), 0);
        if (size && size + bytes > sourceBudget) { chunk++; size = 0; }
        for (const name of component) if (modules.get(name)!.isIncluded !== false) assignments.set(name, `vendor-${String(chunk).padStart(3, "0")}`);
        size += bytes;
      }
    }
    return assignments.get(id);
  };
}
