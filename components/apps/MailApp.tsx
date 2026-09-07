/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState } from 'react';
import { Mail, Star, Trash2, Inbox, Send, Archive, Shield, Wifi } from 'lucide-react';
import { Email } from '../../types';

interface MailAppProps {
    emails: Email[];
}

export const MailApp: React.FC<MailAppProps> = ({ emails }) => {
    const [selectedEmailId, setSelectedEmailId] = useState<number | null>(null);
    const selectedEmail = emails.find(e => e.id === selectedEmailId);

    React.useEffect(() => {
        if (selectedEmailId !== null && !selectedEmail) {
            setSelectedEmailId(null);
        }
    }, [emails, selectedEmailId, selectedEmail]);

    return (
        <div className="h-full w-full bg-transparent flex text-holo-text font-mono">
            {/* Sidebar */}
            <div className="w-56 bg-holo-panel/30 border-r border-holo-border/30 flex-shrink-0 overflow-y-auto backdrop-blur-sm">
                <div className="p-4 border-b border-holo-border/30 mb-2">
                    <div className="text-xs text-holo-text/50 uppercase mb-1 tracking-widest">Network</div>
                    <div className="text-holo-accent font-bold flex items-center gap-2 text-glow-sm">
                        <Wifi size={16} /> SECURE_LINK
                    </div>
                </div>
                <nav className="flex flex-col gap-1 px-2">
                    <button className="flex items-center gap-3 px-3 py-2 bg-holo-accent/10 text-holo-accent border-l-2 border-holo-accent text-xs font-bold uppercase tracking-wider shadow-[inset_10px_0_20px_rgba(0,243,255,0.05)]">
                        <Inbox size={14} /> Incoming
                        {emails.filter(e => e.unread).length > 0 && (
                            <span className="ml-auto bg-holo-accent text-black text-[10px] px-1.5 py-0.5 font-bold rounded-sm">
                                {emails.filter(e => e.unread).length}
                            </span>
                        )}
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 text-holo-text/70 hover:bg-holo-text/5 hover:text-holo-textBright text-xs font-medium uppercase tracking-wider transition-colors border-l-2 border-transparent hover:border-holo-text/30">
                        <Star size={14} /> Priority
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 text-holo-text/70 hover:bg-holo-text/5 hover:text-holo-textBright text-xs font-medium uppercase tracking-wider transition-colors border-l-2 border-transparent hover:border-holo-text/30">
                        <Send size={14} /> Outgoing
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 text-holo-text/70 hover:bg-holo-text/5 hover:text-holo-textBright text-xs font-medium uppercase tracking-wider transition-colors border-l-2 border-transparent hover:border-holo-text/30">
                        <Archive size={14} /> Archive
                    </button>
                    <button className="flex items-center gap-3 px-3 py-2 text-holo-text/70 hover:bg-holo-text/5 hover:text-holo-textBright text-xs font-medium uppercase tracking-wider transition-colors border-l-2 border-transparent hover:border-holo-text/30">
                        <Trash2 size={14} /> Trash
                    </button>
                </nav>
                
                <div className="mt-auto p-4 text-[10px] text-holo-text/30">
                    PROTOCOL: QUANTUM-V2<br/>
                    NODE: ORION-7
                </div>
            </div>

            {/* Email List */}
            <div className={`${selectedEmail ? 'hidden md:block' : 'block'} w-full md:w-96 border-r border-holo-border/30 overflow-y-auto bg-black/20`}>
                {emails.length === 0 ? (
                    <div className="p-8 text-center text-holo-text/30 flex flex-col items-center mt-10">
                        <Inbox size={48} className="mb-4 opacity-20" />
                        <p className="uppercase tracking-widest text-xs">Void Empty</p>
                    </div>
                ) : (
                    emails.map(email => (
                        <div
                            key={email.id}
                            onClick={() => setSelectedEmailId(email.id)}
                            className={`p-4 border-b border-holo-border/20 cursor-pointer hover:bg-holo-accent/5 transition-all group ${selectedEmailId === email.id ? 'bg-holo-accent/10 border-l-2 border-l-holo-accent' : 'border-l-2 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-baseline mb-1">
                                <span className={`text-xs uppercase tracking-wider truncate ${email.unread ? 'text-holo-accent font-bold text-glow-sm' : 'text-holo-text/70'}`}>{email.from}</span>
                                <span className="text-[10px] text-holo-text/40 flex-shrink-0 ml-2 font-mono">{email.time}</span>
                            </div>
                            <div className={`text-sm mb-1 truncate font-mono ${email.unread ? 'text-holo-textBright font-bold' : 'text-holo-text'}`}>
                                {email.unread && <span className="text-holo-alert mr-2 animate-pulse">!</span>}
                                {email.subject}
                            </div>
                            <div className="text-xs text-holo-text/40 truncate font-mono lowercase group-hover:text-holo-text/60">{email.preview}</div>
                        </div>
                    ))
                )}
            </div>

            {/* Email View */}
            <div className={`${selectedEmail ? 'block' : 'hidden md:block'} flex-1 bg-transparent overflow-y-auto p-6 relative`}>
                {selectedEmail ? (
                    <div className="h-full flex flex-col">
                        <button className="md:hidden mb-4 text-holo-accent text-xs uppercase" onClick={() => setSelectedEmailId(null)}>
                            &lt; Back to Stream
                        </button>
                        
                        <div className="border border-holo-border/40 p-6 bg-holo-panel/20 relative flex-1 shadow-glow-lg">
                            {/* Decorators */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-holo-accent" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-holo-accent" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-holo-accent" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-holo-accent" />

                            <div className="border-b border-holo-border/30 pb-4 mb-6">
                                <h2 className="text-xl font-bold text-holo-textBright mb-2 font-mono text-glow">{selectedEmail.subject}</h2>
                                <div className="flex justify-between items-end">
                                    <div className="space-y-1">
                                        <div className="text-xs text-holo-text/50 uppercase tracking-widest">Origin Signal</div>
                                        <div className="text-holo-accent font-mono">{selectedEmail.from}</div>
                                    </div>
                                    <div className="text-xs text-holo-text/40 font-mono">{selectedEmail.time} // ENCRYPTED</div>
                                </div>
                            </div>
                            
                            <div className="text-holo-text leading-relaxed whitespace-pre-wrap font-mono text-sm">
                                {selectedEmail.body}
                            </div>

                            <div className="mt-12 pt-4 border-t border-holo-border/30 text-[10px] text-holo-text/30 uppercase text-center tracking-[0.3em] animate-pulse">
                                /// END OF STREAM ///
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-holo-text/20 flex-col gap-4">
                         <Shield size={64} strokeWidth={0.5} className="text-holo-accent/20" />
                        <div className="text-xs uppercase tracking-[0.5em] text-glow-sm">Awaiting Signal Selection</div>
                    </div>
                )}
            </div>
        </div>
    );
};