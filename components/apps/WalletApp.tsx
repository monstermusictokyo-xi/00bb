
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { Bitcoin, ArrowUpRight, ArrowDownLeft, RefreshCw, Wallet, History, TrendingUp, Send, QrCode, Lock, Check, Plus } from 'lucide-react';

const INITIAL_TRANSACTIONS = [
    { id: 'tx1', type: 'in', amount: 2.50000000, addr: 'bc1qxy2...', time: '10 min ago', status: 'Confirmed' },
    { id: 'tx2', type: 'out', amount: 0.04200000, addr: '3J98t1...', time: '2 hrs ago', status: 'Confirmed' },
    { id: 'tx3', type: 'in', amount: 10.0000000, addr: 'bc1qmn...', time: 'Yesterday', status: 'Confirmed' },
    { id: 'tx4', type: 'out', amount: 1.10000000, addr: '1A1zP1...', time: '2 days ago', status: 'Confirmed' },
];

export const WalletApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'send' | 'receive'>('overview');
    const [btcPrice, setBtcPrice] = useState(69420.00);
    const [balance, setBalance] = useState(12.45800000);
    const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
    const [isSyncing, setIsSyncing] = useState(false);
    
    // Send Form State
    const [recipientAddress, setRecipientAddress] = useState('');
    const [sendAmount, setSendAmount] = useState('');
    const [errors, setErrors] = useState<{address?: string, amount?: string}>({});
    const [txStatus, setTxStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    // Simulate price ticker
    useEffect(() => {
        const interval = setInterval(() => {
            const fluctuation = (Math.random() - 0.45) * 150;
            setBtcPrice(prev => prev + fluctuation);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    const refresh = () => {
        setIsSyncing(true);
        setTimeout(() => setIsSyncing(false), 2000);
    };

    const handleAddFunds = () => {
        if (isSyncing) return;
        setIsSyncing(true);
        
        // Simulate network delay
        setTimeout(() => {
            const amountToAdd = Number((Math.random() * 2 + 0.1).toFixed(8));
            setBalance(prev => prev + amountToAdd);
            
            const newTx = {
                id: `tx-${Date.now()}`,
                type: 'in',
                amount: amountToAdd,
                addr: 'Deposit (External)',
                time: 'Just now',
                status: 'Confirmed'
            };
            
            setTransactions(prev => [newTx, ...prev]);
            setIsSyncing(false);
        }, 1200);
    };

    const handleSend = () => {
        const newErrors: {address?: string, amount?: string} = {};
        let isValid = true;

        // Basic Bitcoin address validation (Legacy, SegWit, Bech32)
        const btcRegex = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/;
        if (!btcRegex.test(recipientAddress)) {
            newErrors.address = "Invalid Bitcoin address format. Must start with 1, 3, or bc1.";
            isValid = false;
        }

        const val = parseFloat(sendAmount);
        if (!sendAmount || isNaN(val) || val <= 0) {
            newErrors.amount = "Enter a valid positive amount.";
            isValid = false;
        } else if (val > balance) {
            newErrors.amount = "Insufficient funds.";
            isValid = false;
        }

        setErrors(newErrors);

        if (isValid) {
            setTxStatus('sending');
            setTimeout(() => {
                // Deduct balance on send
                setBalance(prev => prev - val);
                
                // Add outgoing transaction
                const newTx = {
                    id: `tx-${Date.now()}`,
                    type: 'out',
                    amount: val,
                    addr: `${recipientAddress.substring(0, 6)}...`,
                    time: 'Just now',
                    status: 'Confirmed'
                };
                setTransactions(prev => [newTx, ...prev]);

                setTxStatus('sent');
                setSendAmount('');
                setRecipientAddress('');
                // Reset to idle handled manually or by user interaction
            }, 2000);
        }
    };

    return (
        <div className="h-full w-full bg-black flex flex-col font-mono text-amber-500 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(245,158,11,0.05)_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

            {/* Header */}
            <div className="bg-amber-900/10 border-b border-amber-500/30 p-4 flex justify-between items-center backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-amber-500 flex items-center justify-center bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                        <Bitcoin className="text-amber-500" size={24} />
                    </div>
                    <div>
                        <div className="text-sm font-bold tracking-widest uppercase text-amber-400 drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]">Satoshi Vault</div>
                        <div className="text-[10px] text-amber-500/60 flex items-center gap-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-200 animate-ping' : 'bg-green-500'}`} />
                            {isSyncing ? 'SYNCING NODE...' : 'CONNECTED'}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-amber-500/60 uppercase">Current Price</div>
                    <div className="text-sm font-bold text-amber-400">${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-amber-500/20 bg-black/50 backdrop-blur-sm z-10">
                <button 
                    onClick={() => setActiveTab('overview')}
                    className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'overview' ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500' : 'text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/5'}`}
                >
                    <Wallet size={14} /> Overview
                </button>
                <button 
                    onClick={() => setActiveTab('send')}
                    className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'send' ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500' : 'text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/5'}`}
                >
                    <Send size={14} /> Send
                </button>
                <button 
                    onClick={() => setActiveTab('receive')}
                    className={`flex-1 py-3 text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'receive' ? 'bg-amber-500/20 text-amber-400 border-b-2 border-amber-500' : 'text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/5'}`}
                >
                    <ArrowDownLeft size={14} /> Receive
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 relative z-0">
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Balance Card */}
                        <div className="p-6 border border-amber-500/30 bg-amber-900/5 relative group hover:border-amber-500/60 transition-colors">
                            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                                <Bitcoin size={64} />
                            </div>
                            <div className="text-xs text-amber-500/60 uppercase tracking-widest mb-1">Total Balance</div>
                            <div className="text-4xl font-bold text-amber-400 mb-2 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                                {balance.toFixed(8)} <span className="text-lg">BTC</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <div className="text-sm text-amber-500/80">
                                    ≈ ${(balance * btcPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD
                                </div>
                                <button 
                                    onClick={handleAddFunds}
                                    disabled={isSyncing}
                                    className="flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500 hover:text-black border border-amber-500/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSyncing ? <RefreshCw size={12} className="animate-spin" /> : <Plus size={12} />}
                                    Add Funds
                                </button>
                            </div>
                        </div>

                        {/* Transactions */}
                        <div>
                            <div className="flex justify-between items-center mb-4 border-b border-amber-500/20 pb-2">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-amber-400">
                                    <History size={14} /> Recent Activity
                                </h3>
                                <button onClick={refresh} className={`p-1 hover:bg-amber-500/20 rounded ${isSyncing ? 'animate-spin' : ''}`}>
                                    <RefreshCw size={14} />
                                </button>
                            </div>
                            <div className="space-y-2">
                                {transactions.map((tx) => (
                                    <div key={tx.id} className="flex items-center justify-between p-3 border border-amber-500/10 bg-amber-900/5 hover:bg-amber-900/20 transition-colors animate-in slide-in-from-right-2 duration-200">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${tx.type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {tx.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                            </div>
                                            <div>
                                                <div className="text-xs font-bold text-amber-200">{tx.type === 'in' ? 'Received' : 'Sent'}</div>
                                                <div className="text-[10px] text-amber-500/50">{tx.time}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${tx.type === 'in' ? 'text-green-400' : 'text-amber-400'}`}>
                                                {tx.type === 'in' ? '+' : '-'}{tx.amount.toFixed(8)} BTC
                                            </div>
                                            <div className="text-[10px] text-amber-500/40">{tx.status}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'send' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border border-amber-500/30 p-6 bg-amber-900/5">
                            {txStatus === 'sent' ? (
                                <div className="flex flex-col items-center justify-center py-10 text-green-500 space-y-4">
                                    <div className="p-4 rounded-full border-2 border-green-500 bg-green-500/10 animate-in zoom-in duration-300">
                                        <Check size={32} />
                                    </div>
                                    <div className="font-bold text-lg uppercase tracking-widest text-green-400">Transaction Broadcasted</div>
                                    <div className="text-xs text-green-500/60 font-mono">ID: {Math.random().toString(16).substr(2, 64)}...</div>
                                    <button 
                                        onClick={() => setTxStatus('idle')} 
                                        className="mt-4 px-6 py-2 border border-green-500/50 hover:bg-green-500/20 text-green-400 text-xs uppercase tracking-wider transition-colors"
                                    >
                                        Send Another
                                    </button>
                                </div>
                            ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-amber-500/70 mb-2">Recipient Address</label>
                                    <input 
                                        type="text" 
                                        value={recipientAddress}
                                        onChange={(e) => {
                                            setRecipientAddress(e.target.value);
                                            if (errors.address) setErrors(prev => ({...prev, address: undefined}));
                                        }}
                                        placeholder="Enter BTC address" 
                                        className={`w-full bg-black border ${errors.address ? 'border-red-500 text-red-400' : 'border-amber-500/30 text-amber-100'} p-3 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(245,158,11,0.2)] placeholder-amber-500/20 font-mono transition-colors`}
                                    />
                                    {errors.address && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.address}</div>}
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider text-amber-500/70 mb-2">Amount (BTC)</label>
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={sendAmount}
                                            onChange={(e) => {
                                                setSendAmount(e.target.value);
                                                if (errors.amount) setErrors(prev => ({...prev, amount: undefined}));
                                            }}
                                            placeholder="0.00000000" 
                                            className={`w-full bg-black border ${errors.amount ? 'border-red-500 text-red-400' : 'border-amber-500/30 text-amber-100'} p-3 text-sm focus:outline-none focus:border-amber-500 focus:shadow-[0_0_10px_rgba(245,158,11,0.2)] placeholder-amber-500/20 font-mono transition-colors`}
                                        />
                                        <button 
                                            onClick={() => {
                                                setSendAmount(balance.toString());
                                                if (errors.amount) setErrors(prev => ({...prev, amount: undefined}));
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-amber-500/50 hover:text-amber-500 transition-colors font-bold"
                                        >
                                            MAX
                                        </button>
                                    </div>
                                    {errors.amount && <div className="text-red-500 text-[10px] mt-1 font-bold uppercase">{errors.amount}</div>}
                                </div>
                                <div className="pt-4">
                                    <div className="flex justify-between text-[10px] text-amber-500/50 mb-2">
                                        <span>NETWORK FEE</span>
                                        <span>0.00004500 BTC</span>
                                    </div>
                                    <button 
                                        onClick={handleSend}
                                        disabled={txStatus === 'sending'}
                                        className="w-full py-3 bg-amber-500 text-black font-bold uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {txStatus === 'sending' ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />} 
                                        {txStatus === 'sending' ? 'Broadcasting...' : 'Sign & Broadcast'}
                                    </button>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'receive' && (
                    <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="border-2 border-amber-500 p-4 bg-white mb-6 shadow-[0_0_30px_rgba(245,158,11,0.2)] relative">
                             <QrCode size={160} className="text-black" />
                             <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                                 <Bitcoin size={48} className="text-amber-600" />
                             </div>
                        </div>
                        <div className="w-full max-w-xs">
                            <div className="text-[10px] text-amber-500/50 uppercase mb-1">Your Wallet Address</div>
                            <div className="bg-amber-900/20 border border-amber-500/30 p-3 text-xs break-all text-amber-300 font-mono select-all hover:bg-amber-900/40 cursor-pointer transition-colors">
                                1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
                            </div>
                            <div className="mt-4 text-[10px] text-amber-500/40">
                                Only send Bitcoin (BTC) to this address.<br/>Sending any other asset will result in permanent loss.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
