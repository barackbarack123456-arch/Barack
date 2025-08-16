import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SinopticoNode from '../pages/SinopticoNode';
import TreeLines from './TreeLines';

const DraggableSinopticoNode = ({ isOver, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.node.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 1 : 'auto',
        backgroundColor: isOver ? '#e0f2fe' : 'transparent',
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TreeLines level={props.level} isLastChild={props.isLastChild} />
            <SinopticoNode {...props} />
        </div>
    );
};

export default DraggableSinopticoNode;
