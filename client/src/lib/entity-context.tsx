import { createContext, useContext, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { ENTITIES, ENTITY_LABELS, type EntityId } from "@shared/schema";

interface EntityState {
  currentEntity: EntityId;
  setCurrentEntity: (id: EntityId) => void;
  availableEntities: EntityId[];
  entityLabel: string;
}

const EntityContext = createContext<EntityState>({
  currentEntity: "becs",
  setCurrentEntity: () => {},
  availableEntities: ["becs"],
  entityLabel: "BECS",
});

export function EntityProvider({ children }: { children: React.ReactNode }) {
  const { becsUser } = useAuth();
  const [currentEntity, setCurrentEntityRaw] = useState<EntityId>("becs");

  // Super admin and admin get all entities; others get their assigned list
  const availableEntities: EntityId[] = becsUser
    ? (becsUser.role === "super_admin" || becsUser.role === "admin"
        ? [...ENTITIES]
        : (becsUser.entityIds || ["becs"]).filter((e): e is EntityId =>
            ENTITIES.includes(e as EntityId)
          ))
    : ["becs"];

  const setCurrentEntity = useCallback(
    (id: EntityId) => {
      if (availableEntities.includes(id)) {
        setCurrentEntityRaw(id);
      }
    },
    [availableEntities]
  );

  const entityLabel = ENTITY_LABELS[currentEntity] || currentEntity;

  return (
    <EntityContext.Provider
      value={{ currentEntity, setCurrentEntity, availableEntities, entityLabel }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export function useEntity() {
  return useContext(EntityContext);
}
