import { useMemo } from 'react';

export const useFlattenedTree = (tree) => {
    return useMemo(() => {
        if (!tree) {
            return [];
        }

        const flatten = (nodes, level = 0, parentId = null) => {
            let flattened = [];
            nodes.forEach((node, index) => {
                flattened.push({
                    ...node,
                    level,
                    parentId,
                    isLastChild: index === nodes.length - 1,
                });

                if (node.children && node.children.length > 0) {
                    flattened = flattened.concat(
                        flatten(node.children, level + 1, node.id)
                    );
                }
            });
            return flattened;
        };

        return flatten(tree);
    }, [tree]);
};
