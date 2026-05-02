import React, { useRef } from 'react';
import { Users, Phone, Mail, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

const HeadsCard = ({ heads = [] }) => {
    const scrollContainerRef = useRef(null);

    if (!heads || heads.length === 0) {
        return null;
    }

    const hasStructuredData = heads.length > 1 || (heads.length === 1 && !heads[0].rawHtml);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { scrollLeft, clientWidth } = scrollContainerRef.current;
            const scrollTo = direction === 'left' 
                ? scrollLeft - clientWidth / 2 
                : scrollLeft + clientWidth / 2;
            scrollContainerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden mt-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-50 dark:border-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">University Authorities</h2>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => scroll('left')}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button 
                            onClick={() => scroll('right')}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="relative group">
                <div 
                    ref={scrollContainerRef}
                    className="flex overflow-x-auto gap-4 p-6 no-scrollbar snap-x scroll-smooth"
                >
                    {!hasStructuredData ? (
                        <div 
                            className="prose dark:prose-invert max-w-none text-sm w-full"
                            dangerouslySetInnerHTML={{ __html: heads[0].rawHtml }}
                        />
                    ) : (
                        heads.map((head, index) => {
                            if (head.rawHtml) return null;
                            
                            // Heuristic to detect if it's a generic department card rather than a person
                            const isGeneric = head.name === head.type || !head.name;
                            
                            if (isGeneric) {
                                // Filter out duplicate consecutive lines for cleaner display
                                const uniqueLines = head.raw.filter((line, idx, arr) => idx === 0 || line !== arr[idx - 1]);
                                
                                return (
                                    <div 
                                        key={index} 
                                        className="flex-shrink-0 w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden snap-start flex flex-col hover:border-blue-200 dark:hover:border-blue-800/50 transition-all"
                                    >
                                        <div className="pt-6 pb-4 flex justify-center bg-white dark:bg-gray-800">
                                            <div className="relative">
                                                {head.image && !head.image.includes('broken') ? (
                                                    <img 
                                                        src={head.image} 
                                                        alt={head.type} 
                                                        className="w-24 h-24 object-contain z-10 transition-transform hover:scale-110"
                                                    />
                                                ) : (
                                                    <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-md">
                                                        <Users className="w-10 h-10 text-blue-400 dark:text-blue-500" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 dark:bg-gray-900/50 py-2 px-4 flex items-center justify-center border-y border-gray-100 dark:border-gray-700">
                                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider text-center line-clamp-1">
                                                {head.type || 'Department Info'}
                                            </span>
                                        </div>
                                        <div className="p-5 flex-1 flex flex-col space-y-3 overflow-y-auto">
                                            {uniqueLines.slice(1).map((line, idx) => {
                                                if (line.toLowerCase().includes('book appointment')) return null;
                                                return (
                                                    <p key={idx} className="text-[12px] text-gray-700 dark:text-gray-300 leading-snug border-b border-gray-50 dark:border-gray-700/50 pb-2 last:border-0">
                                                        {line}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }
                            
                            // Parse email and phone from raw lines
                            let rawEmail = head.raw[4] || '';
                            let rawPhone = '';
                            // The phone number usually appears at index 5 if it exists
                            if (head.raw[5] && !head.raw[5].toLowerCase().includes('book appointment') && !head.raw[5].toLowerCase().includes('click here')) {
                                rawPhone = head.raw[5];
                            }

                            const email = rawEmail === 'NA' || rawEmail === '' ? 'Not Available' : rawEmail;
                            const phone = rawPhone || 'No Number';

                            return (
                                <div 
                                    key={index} 
                                    className="flex-shrink-0 w-[280px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden snap-start flex flex-col hover:border-blue-200 dark:hover:border-blue-800/50 transition-all"
                                >
                                    {/* Top Section with Image */}
                                    <div className="pt-6 pb-4 flex justify-center bg-white dark:bg-gray-800">
                                        <div className="relative">
                                            {head.image && !head.image.includes('broken') ? (
                                                <img 
                                                    src={head.image} 
                                                    alt={head.name} 
                                                    className="w-28 h-28 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-md z-10"
                                                />
                                            ) : (
                                                <div className="w-28 h-28 rounded-full bg-gray-50 dark:bg-gray-900 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-md">
                                                    <Users className="w-12 h-12 text-gray-300 dark:text-gray-700" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Designation Bar */}
                                    <div className="bg-gray-50 dark:bg-gray-900/50 py-2 px-4 flex items-center justify-center gap-2 border-y border-gray-100 dark:border-gray-700">
                                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                                            {head.type || 'Contact'}
                                        </span>
                                    </div>

                                    {/* Details Section */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="space-y-0.5 mb-4">
                                            <h3 className="text-[14px] font-bold text-gray-900 dark:text-white leading-tight">
                                                {head.name}
                                            </h3>
                                            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-400">
                                                {head.role}
                                            </p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-500">
                                                {head.dept}
                                            </p>
                                        </div>

                                        <div className="space-y-1.5 mt-4">
                                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                                <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="text-[11px] truncate" title={email}>{email}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                                                <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                                                <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                                                    {phone}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions Section */}
                                        <div className="mt-auto pt-5 flex flex-col gap-3">
                                            {head.type?.toLowerCase().includes('mentor') && (
                                                <div className="text-center px-2">
                                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
                                                        Need help with mentorship?{" "}
                                                        <button className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer">
                                                            Click Here
                                                        </button>
                                                    </p>
                                                </div>
                                            )}
                                            
                                            <button className="cursor-pointer w-full py-2.5 bg-gray-900 dark:bg-gray-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-gray-900 text-[11px] font-bold rounded-lg transition-all shadow-sm">
                                                Book Appointment
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
        </div>
    );
};

export default HeadsCard;
