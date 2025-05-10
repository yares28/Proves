"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LucideQuote } from "lucide-react"

const testimonials = [
  {
    quote:
      "This app has completely transformed how I organize my exam schedule. I used to miss exams or study for the wrong ones, but now everything is clear and organized.",
    author: "Maria Rodriguez",
    role: "Computer Science Student",
    avatar: "MR",
  },
  {
    quote:
      "The filtering system is incredible. I can quickly find all my exams for specific subjects or semesters, which makes planning my study schedule so much easier.",
    author: "Alex Chen",
    role: "Engineering Student",
    avatar: "AC",
  },
  {
    quote:
      "Being able to export my exam schedule to Google Calendar means I never miss an important date. This app has saved me multiple times!",
    author: "Sarah Johnson",
    role: "Business Administration Student",
    avatar: "SJ",
  },
]

export function Testimonials() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto px-4 md:px-6">
        <div className="mb-16 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl"
          >
            What <span className="text-primary">Students</span> Say
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto max-w-2xl text-lg text-muted-foreground"
          >
            Hear from students who have transformed their exam preparation with our platform.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
              className="group"
            >
              <Card className="h-full overflow-hidden border-none bg-gradient-to-br from-white to-emerald-50 shadow-lg transition-all duration-300 hover:shadow-xl dark:from-emerald-900/80 dark:to-emerald-950/80">
                <CardContent className="flex h-full flex-col p-8">
                  <div className="relative mb-6">
                    <LucideQuote className="h-10 w-10 text-primary/30" />
                    <div className="absolute -right-1 -top-1 h-16 w-16 rounded-full bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                  </div>
                  <p className="mb-8 flex-1 text-lg leading-relaxed">{testimonial.quote}</p>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/10">
                      <AvatarFallback className="bg-primary/10 text-primary">{testimonial.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
