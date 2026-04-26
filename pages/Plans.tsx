import React, { useState } from 'react';

const PlanCard = ({ title, price, features, isPopular, buttonText, billingCycle }: { title: string; price: string; features: string[]; isPopular?: boolean; buttonText: string; billingCycle: string }) => (
    <div className={`flex flex-col p-8 rounded-3xl border transition-all duration-300 ${isPopular ? 'bg-[#121212] border-[#B6FF00]/40 scale-105 shadow-2xl z-10' : 'bg-[#121212] border-zinc-200 dark:border-zinc-800 hover:border-white/20'}`}>
        {isPopular && <div className="bg-[#B6FF00] text-black text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full w-max mb-6 neon-glow mx-auto">Mais Popular</div>}
        <h3 className="text-2xl font-black tracking-tighter mb-2 text-center">{title}</h3>
        <div className="flex items-baseline justify-center mb-2">
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mr-1">R$</span>
            <span className="text-5xl font-black tracking-tighter">{price}</span>
            <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 ml-1">/mês</span>
        </div>
        <div className="h-4 flex items-center justify-center mb-6">
            {billingCycle === 'annual' && (
                <span className="text-xs font-bold text-[#B6FF00] tracking-wide">
                    11 meses pagos + 1 mês grátis
                </span>
            )}
        </div>
        <ul className="space-y-4 mb-10 flex-grow">
            {features.map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#B6FF00] mt-1.5 shrink-0"></div>
                    <span>{feature}</span>
                </li>
            ))}
        </ul>
        <button className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isPopular ? 'bg-[#B6FF00] text-black neon-glow hover:opacity-90' : 'bg-white/5 text-white hover:bg-white/10'}`}>
            {buttonText}
        </button>
    </div>
);

const Plans = () => {
    const [isAnnual, setIsAnnual] = useState(false);

    return (
        <div className="max-w-5xl mx-auto py-10">
            <div className="text-center mb-10">
                <h1 className="text-5xl font-black tracking-tighter mb-4">Escolha seu Nível</h1>
                <p className="text-zinc-500 dark:text-zinc-400 text-lg font-medium max-w-xl mx-auto">Três planos pagos para estruturar margem, automação e comando operacional no ritmo da sua empresa.</p>
            </div>

            <div className="flex justify-center mb-12">
                <div className="bg-[#121212] border border-zinc-200 dark:border-zinc-800 p-1 rounded-full flex items-center">
                    <button 
                        onClick={() => setIsAnnual(false)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-[#B6FF00] text-black' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Mensal
                    </button>
                    <button 
                        onClick={() => setIsAnnual(true)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${isAnnual ? 'bg-[#B6FF00] text-black' : 'text-zinc-400 hover:text-white'}`}
                    >
                        Anual
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <PlanCard 
                    title="Common" 
                    price="97" 
                    buttonText="Assinar Agora"
                    billingCycle={isAnnual ? 'annual' : 'monthly'}
                    features={[
                        "Até 2 empresas vinculadas",
                        "Dashboard em tempo real",
                        "Calculadora de margem e preço ideal",
                        "Relatórios básicos",
                        "Chat IA essencial",
                        "Suporte via e-mail"
                    ]}
                />
                <PlanCard 
                    title="Premium" 
                    price="137" 
                    isPopular
                    buttonText="Assinar Agora"
                    billingCycle={isAnnual ? 'annual' : 'monthly'}
                    features={[
                        "Até 10 empresas vinculadas",
                        "WhatsApp e Instagram",
                        "Alertas de margem",
                        "Relatórios automáticos semanais",
                        "Chat IA ampliado",
                        "Recomendações práticas da IA",
                        "Suporte prioritário"
                    ]}
                />
                <PlanCard 
                    title="Pro Business" 
                    price="247" 
                    buttonText="Começar Agora"
                    billingCycle={isAnnual ? 'annual' : 'monthly'}
                    features={[
                        "Empresas ilimitadas",
                        "Tudo do Premium",
                        "Mercado Livre, Mercado Pago e Shopee",
                        "Insights preditivos avançados",
                        "Integrações customizadas via API",
                        "Rotinas operacionais avançadas",
                        "Acompanhamento prioritário"
                    ]}
                />
            </div>

            <div className="mt-20 p-10 rounded-3xl bg-[#121212] border border-zinc-200 dark:border-zinc-800 text-center">
                <h3 className="text-2xl font-black tracking-tighter mb-4">Precisa de algo sob medida?</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-8 max-w-lg mx-auto">Para operações de grande escala ou necessidades específicas de integração, nosso plano Enterprise é a solução ideal.</p>
                <button className="border-b-2 border-[#B6FF00] text-[#B6FF00] font-black text-sm uppercase tracking-widest pb-1 hover:opacity-80 transition-all">
                    Solicitar Orçamento Customizado
                </button>
            </div>
        </div>
    );
};

export default Plans;
