import MinimalLayout from "@/components/MinimalLayout";
import { Card } from "@/components/ui/card";

const PrivacyPolicy = () => {
    return (
        <MinimalLayout>
            <div className="max-w-4xl mx-auto py-12 px-4">
                <Card className="p-8 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                    <h1 className="font-pixel text-4xl mb-6">Privacy Policy</h1>
                    <p className="text-muted-foreground mb-8 font-mono">Last updated: {new Date().toLocaleDateString()}</p>

                    <div className="space-y-6 font-mono text-sm">
                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">1. Introduction</h2>
                            <p>
                                Welcome to TaskTracker ("we," "our," or "us"). We are committed to protecting your privacy 
                                and your personal data. This Privacy Policy explains how we collect, use, and protect your 
                                information when you use our task management application.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">2. Information We Collect</h2>
                            <ul className="list-disc pl-5 space-y-2">
                                <li><strong>Account Information:</strong> When you sign up via Google, we collect your email address, name, and profile picture.</li>
                                <li><strong>Task Data:</strong> We store the tasks, projects, and comments you create to provide the service.</li>
                                <li><strong>Calendar Access:</strong> If you grant permission, we access your Google Calendar to sync tasks with due dates. We only read/write events created by our application.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">3. How We Use Google Data</h2>
                            <p className="mb-2">
                                Our application's use and transfer of information received from Google APIs to any other app will adhere to the 
                                <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" className="underline text-primary ml-1">
                                    Google API Services User Data Policy
                                </a>, including the Limited Use requirements.
                            </p>
                            <p>
                                Specifically, we use your Google Calendar data solely to:
                            </p>
                            <ul className="list-disc pl-5 mt-2">
                                <li>Create events for your tasks with due dates.</li>
                                <li>Update events when you change task details (title, time, priority).</li>
                                <li>We do <strong>not</strong> read your existing personal events or share this data with third parties.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold mb-3 uppercase">4. Data Security</h2>
                            <p>
                                We implement appropriate technical measures to protect your personal data against unauthorized access.
                                However, no internet transmission is 100% secure, and we cannot guarantee absolute security.
                            </p>
                        </section>
                    </div>
                </Card>
            </div>
        </MinimalLayout>
    );
};

export default PrivacyPolicy;
