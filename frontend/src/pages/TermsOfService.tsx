import MinimalLayout from "@/components/MinimalLayout";
import { Card } from "@/components/ui/card";

const TermsOfService = () => {
    return (
        <MinimalLayout>
            <div className="max-w-4xl mx-auto py-12 px-4">
                <Card className="p-8 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <h1 className="font-pixel text-4xl mb-6">Terms of Service</h1>
                    <p className="text-muted-foreground mb-8 font-mono">Last updated: {new Date().toLocaleDateString()}</p>

                    <div className="space-y-6 font-mono text-sm">
                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">1. Terms</h2>
                            <p>
                                By accessing TaskTracker, you are agreeing to be bound by these terms of service, all applicable laws and regulations, 
                                and agree that you are responsible for compliance with any applicable local laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">2. Use License</h2>
                            <p>
                                Permission is granted to temporarily use the TaskTracker application for personal, non-commercial transitory viewing only. 
                                This is the grant of a license, not a transfer of title.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">3. Disclaimer</h2>
                            <p>
                                The materials on TaskTracker are provided on an 'as is' basis. TaskTracker makes no warranties, expressed or implied, 
                                and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions 
                                of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">4. Limitations</h2>
                            <p>
                                In no event shall TaskTracker or its suppliers be liable for any damages (including, without limitation, damages for loss 
                                of data or profit, or due to business interruption) arising out of the use or inability to use TaskTracker.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">5. Accuracy of materials</h2>
                            <p>
                                The materials appearing on TaskTracker could include technical, typographical, or photographic errors. TaskTracker does 
                                not warrant that any of the materials on its website are accurate, complete or current.
                            </p>
                        </section>
                    </div>
                </Card>
            </div>
        </MinimalLayout>
    );
};

export default TermsOfService;
