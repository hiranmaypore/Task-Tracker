import MinimalLayout from "@/components/MinimalLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Github, Twitter, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const Contact = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const message = formData.get('message') as string;

        const subject = encodeURIComponent(`TaskTracker Contact: Message from ${name}`);
        const body = encodeURIComponent(
            `Name: ${name}\n` +
            `Email: ${email}\n\n` +
            `Message:\n${message}`
        );

        // Open mail client
        window.location.href = `mailto:hiranmay.dev@gmail.com?subject=${subject}&body=${body}`;

        setLoading(false);
        toast({
            title: "Mail Client Opening",
            description: "Please send the drafted email in your mail application.",
        });
        (e.target as HTMLFormElement).reset();
    };

    return (
        <MinimalLayout>
            <div className="max-w-4xl mx-auto py-12 px-4">
                <div className="grid md:grid-cols-2 gap-8">
                    <Card className="p-8 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))]">
                        <h1 className="font-pixel text-4xl mb-6">Contact Us</h1>
                        <p className="text-muted-foreground mb-8 font-mono">
                            Have questions, suggestions, or found a bug? We'd love to hear from you.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4 font-mono">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Name</label>
                                <Input name="name" required placeholder="Your name" className="border-2 border-foreground" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Email</label>
                                <Input name="email" required type="email" placeholder="your@email.com" className="border-2 border-foreground" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase">Message</label>
                                <Textarea name="message" required placeholder="How can we help?" className="border-2 border-foreground min-h-[150px]" />
                            </div>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="w-full font-pixel bg-primary text-primary-foreground border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0px_hsl(var(--foreground))] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all py-6 text-lg"
                            >
                                {loading ? "SENDING..." : "SEND MESSAGE"}
                            </Button>
                        </form>
                    </Card>

                    <div className="space-y-6">
                        <Card className="p-6 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] bg-secondary/10">
                            <h2 className="font-pixel text-xl mb-4">Direct Contact</h2>
                            <div className="space-y-4 font-mono">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-card border-2 border-foreground">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Email</p>
                                        <a 
                                            href="mailto:hiranmay.dev@gmail.com" 
                                            className="text-sm hover:text-primary transition-colors underline decoration-2 underline-offset-4"
                                        >
                                            hiranmay.dev@gmail.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-card border-2 border-foreground">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Support Hours</p>
                                        <p className="text-sm">Mon - Fri: 9AM - 5PM EST</p>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-6 border-2 border-foreground shadow-[4px_4px_0px_hsl(var(--foreground))] bg-accent/10">
                            <h2 className="font-pixel text-xl mb-4">Follow Us</h2>
                            <div className="flex gap-4">
                                <a href="https://github.com/hiranmaypore" target="_blank" className="p-3 bg-card border-2 border-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-[2px_2px_0px_hsl(var(--foreground))]">
                                    <Github className="w-6 h-6" />
                                </a>
                                <a href="https://x.com/HiranmayPore" target="_blank" className="p-3 bg-card border-2 border-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-[2px_2px_0px_hsl(var(--foreground))]">
                                    <Twitter className="w-6 h-6" />
                                </a>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </MinimalLayout>
    );
};

export default Contact;
