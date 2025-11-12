import { AbilityBuilder, createMongoAbility } from "@casl/ability";

export function defineAbilityFor(role) {
    const { can, build } = new AbilityBuilder(createMongoAbility );
  
    if (role === 'admin') {
        can('manage', 'all');
    }

    return build();
};