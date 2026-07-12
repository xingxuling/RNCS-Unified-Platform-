import { listFAQ, listFAQCategories, faqByCategory } from "@/lib/learning/faqGenerator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export function FAQPanel() {
  const categories = listFAQCategories();
  const all = listFAQ();
  return (
    <div className="space-y-4">
      {categories.map((c) => {
        const items = faqByCategory(c.id);
        if (items.length === 0) return null;
        return (
          <Card key={c.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {items.map((f) => (
                  <AccordionItem key={f.id} value={f.id}>
                    <AccordionTrigger className="text-sm text-left">{f.question}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground">{f.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        );
      })}
      <div className="text-xs text-muted-foreground">共 {all.length} 条 FAQ。</div>
    </div>
  );
}
