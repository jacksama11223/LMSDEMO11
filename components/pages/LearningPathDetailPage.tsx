
import React, { useContext, useMemo } from 'react';
import { DataContext, PageContext } from '../../contexts/AppProviders';
import DuolingoTree from '../common/DuolingoTree';
import type { LearningNode } from '../../types';

interface LearningPathDetailPageProps {
    pathId: string;
}

const LearningPathDetailPage: React.FC<LearningPathDetailPageProps> = ({ pathId }) => {
    const { db } = useContext(DataContext)!;
    const { navigate } = useContext(PageContext)!;

    const path = useMemo(() => db.LEARNING_PATHS?.[pathId], [db.LEARNING_PATHS, pathId]);

    const handleNodeClick = (node: LearningNode, isLast: boolean) => {
        navigate('learning_node_study', { pathId, nodeId: node.id, isLastNode: isLast });
    };

    if (!path) {
        return <div className="p-8 text-center text-red-500">Lộ trình không tồn tại. <button onClick={() => navigate('assignment_hub')} className="underline">Quay lại</button></div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <button 
                onClick={() => navigate('assignment_hub')} 
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-400 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300 backdrop-blur-md w-fit mb-4"
            >
                <span>&larr;</span> <span className="font-medium">Quay lại Danh sách</span>
            </button>
            
            <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-200 drop-shadow-lg mb-3">{path.title}</h1>
                <p className="text-blue-200/80 text-lg">Chủ đề: <span className="font-bold text-white">{path.topic}</span></p>
            </div>

            <div className="card p-12 min-h-[600px] bg-black/20 border border-white/10 relative backdrop-blur-xl shadow-2xl rounded-[3rem]">
                <DuolingoTree nodes={path.nodes} onNodeClick={handleNodeClick} />
            </div>
        </div>
    );
};

export default LearningPathDetailPage;
