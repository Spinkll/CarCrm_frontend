"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Wrench, ShieldCheck, Clock, CheckCircle2, Star, CalendarDays, Phone, Mail, MapPin, ClipboardList, Search, ThumbsUp, Activity, Car, Disc, Cog, FileSearch, Wind, LifeBuoy, ArrowUp, MessageSquareQuote, ChevronDown, Users, Award, Timer } from "lucide-react"

export default function LandingPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showScrollTopButton, setShowScrollTopButton] = useState(false)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem("access_token"))

    const handleWindowScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTopButton(true)
      } else {
        setShowScrollTopButton(false)
      }
    }

    window.addEventListener("scroll", handleWindowScroll)
    return () => window.removeEventListener("scroll", handleWindowScroll)
  }, [])

  const smoothScrollTo = (targetY: number) => {
    const scrollElement = document.scrollingElement || document.documentElement;
    const startY = scrollElement.scrollTop;
    const diff = targetY - startY;
    if (diff === 0) return;

    const duration = 600;
    const startTime = performance.now();

    const easeInOutCubic = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      scrollElement.scrollTop = startY + diff * eased;

      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };

    requestAnimationFrame(animateScroll);
  }

  const scrollToTop = () => smoothScrollTo(0);

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const rect = element.getBoundingClientRect();
      const scrollElement = document.scrollingElement || document.documentElement;
      smoothScrollTo(scrollElement.scrollTop + rect.top);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans w-full">
      {/* HEADER */}
      <header className="relative z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-7 md:size-8 items-center justify-center rounded-lg bg-primary">
              <Wrench className="size-3.5 md:size-4 text-primary-foreground" />
            </div>
            <span className="text-lg md:text-xl font-bold tracking-tight text-foreground">WagGarage</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <a href="#services" onClick={(e) => handleScrollTo(e, 'services')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Послуги</a>
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Переваги</a>
            <a href="#contacts" onClick={(e) => handleScrollTo(e, 'contacts')} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer">Контакти</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-4">
            {!isAuthenticated && (
              <Link href="/login">
                <Button variant="ghost" className="hidden sm:flex text-sm">Увійти</Button>
              </Link>
            )}
            <Link href="/dashboard">
              <Button className="gap-2 rounded-full h-8 px-3 md:h-10 md:px-4 text-xs md:text-sm">
                <span className="hidden sm:inline">Особистий кабінет</span>
                <span className="sm:hidden">Кабінет</span>
                <ArrowRight className="size-4 hidden sm:block" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full">
        {/* HERO SECTION */}
        <section className="relative w-full py-14 md:py-24 lg:py-32 overflow-hidden bg-black flex items-center min-h-[40vh]">
          {/* ФОНОВЕ ЗОБРАЖЕННЯ */}
          <div
            className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/hero-bg.jpg')" }}
          >
            {/* Затемнення фону */}
            <div className="absolute inset-0 bg-black/70"></div>
          </div>

          {/* Градієнт для плавного переходу вниз */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/5 to-transparent z-0 pointer-events-none"></div>

          {/* Floating particles */}
          <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
            <div className="absolute top-[15%] left-[10%] w-3 h-3 rounded-full bg-primary/20 animate-float-slow" />
            <div className="absolute top-[25%] right-[15%] w-2 h-2 rounded-full bg-primary/30 animate-float-medium" />
            <div className="absolute top-[60%] left-[20%] w-4 h-4 rounded-full bg-primary/10 animate-float-medium" style={{ animationDelay: '1s' }} />
            <div className="absolute top-[40%] right-[25%] w-2.5 h-2.5 rounded-full bg-white/10 animate-float-fast" />
            <div className="absolute top-[70%] left-[60%] w-3.5 h-3.5 rounded-full bg-primary/15 animate-float-slow" style={{ animationDelay: '3s' }} />
            <div className="absolute top-[20%] left-[45%] w-1.5 h-1.5 rounded-full bg-white/15 animate-float-fast" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[80%] right-[10%] w-2 h-2 rounded-full bg-primary/20 animate-float-medium" style={{ animationDelay: '4s' }} />
            <div className="absolute top-[50%] left-[80%] w-3 h-3 rounded-full bg-white/5 animate-float-slow" style={{ animationDelay: '2s' }} />
          </div>

          <div className="container relative mx-auto px-4 md:px-6 z-10 w-full mb-8 md:mb-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="flex flex-col items-center gap-4 md:gap-6 text-center max-w-4xl mx-auto w-full"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs md:text-sm font-medium text-white mb-2 md:mb-4 backdrop-blur-md"
              >
                <Star className="mr-1.5 md:mr-2 size-3 md:size-4 text-primary fill-primary" /> Сучасний сервіс
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl w-full text-white drop-shadow-sm leading-tight"
              >
                Професійне обслуговування <br className="hidden sm:block" /><span className="text-primary drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)] animate-shimmer">без компромісів</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="mx-auto max-w-[700px] text-base md:text-lg text-gray-300 lg:text-xl leading-relaxed w-full drop-shadow-sm px-2 sm:px-0 mt-2"
              >
                Довірте своє авто професіоналам WagGarage. Швидка діагностика, оригінальні запчастини та гарантія на всі види робіт. Ваш спокій — наш пріоритет.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-3 mt-6 md:mt-8 w-full sm:w-auto px-4 sm:px-0"
              >
                <Link href="/dashboard" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full gap-2 rounded-full text-sm md:text-base h-12 md:h-14 px-6 md:px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow animate-pulse-glow">
                    <CalendarDays className="size-4 md:size-5" /> Записатися онлайн
                  </Button>
                </Link>
                <a href="#services" onClick={(e) => handleScrollTo(e, 'services')} className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full rounded-full text-sm md:text-base h-12 md:h-14 px-6 md:px-8 bg-black/30 text-white border-white/20 hover:bg-white/10 hover:text-white backdrop-blur-md transition-all">
                    Наші послуги
                  </Button>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="w-full py-16 md:py-24 bg-background border-y border-border/50 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-blob pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-blob-delay-2 pointer-events-none" />
          <div className="container mx-auto px-4 md:px-6 w-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full">
              {[
                { icon: ShieldCheck, title: "Гарантія якості", desc: "Даємо гарантію на всі виконані роботи та встановлені запчастини від 1 року." },
                { icon: Clock, title: "Виконання в строк", desc: "Цінуємо ваш час. Роботи виконуються чітко у попередньо обумовлені терміни." },
                { icon: CheckCircle2, title: "Прозорі ціни", desc: "Ви завжди знаєте за що платите. Жодного нав'язування додаткових послуг." }
              ].map((feature, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={i}
                  className="flex flex-col items-center text-center space-y-4 p-6 rounded-2xl bg-secondary/30 hover:bg-secondary/50 transition-colors border border-border/50 w-full"
                >
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <feature.icon className="size-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* SERVICES */}
        <section id="services" className="w-full py-16 md:py-24 bg-secondary/10">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12 w-full"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Популярні послуги</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Надаємо повний спектр послуг з ремонту та технічного обслуговування автомобілів.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto w-full">
              {[
                { title: "Комп'ютерна діагностика", icon: Activity },
                { title: "Планове ТО", icon: ClipboardList },
                { title: "Ремонт ходової частини", icon: Car },
                { title: "Обслуговування гальмівної системи", icon: Disc },
                { title: "Ремонт двигунів", icon: Cog },
                { title: "Діагностика авто перед покупкою", icon: FileSearch },
                { title: "Обслуговування кондиціонерів", icon: Wind },
                { title: "Шиномонтаж та балансування", icon: LifeBuoy }
              ].map((service, i) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  whileInView={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={i}
                  className="w-full h-full"
                >
                  <Card className="group h-full hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 bg-card w-full relative overflow-hidden animate-card-glow" style={{ animationDelay: `${i * 0.5}s` }}>
                    <CardContent className="p-6 flex flex-col items-start gap-4 h-full">
                      <div className="p-2 rounded-lg bg-primary/5 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                        <service.icon className="size-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground leading-tight">{service.title}</h3>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-16 w-full"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Як ми працюємо</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                4 простих кроки від проблеми з авто до її вирішення.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4 lg:gap-8 max-w-6xl mx-auto w-full relative">
              {/* З'єднувальна лінія для десктопу */}
              <div className="hidden md:block absolute top-[48px] left-[12%] right-[12%] h-[2px] bg-border z-0"></div>

              {[
                { icon: ClipboardList, step: "01", title: "Запис онлайн", desc: "Залишаєте заявку або записуєтесь через кабінет." },
                { icon: Search, step: "02", title: "Діагностика", desc: "Проводимо ретельну перевірку вашого автомобіля." },
                { icon: Wrench, step: "03", title: "Ремонт", desc: "Професійне виконання робіт та заміна деталей." },
                { icon: ThumbsUp, step: "04", title: "Результат", desc: "Отримуєте цілком справне авто з гарантією." },
              ].map((step, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.15 }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={i}
                  className="flex flex-col items-center text-center space-y-4 relative z-10"
                >
                  <div className="w-24 h-24 rounded-full bg-card border-[4px] border-background flex items-center justify-center shadow-lg relative group transition-transform duration-300 hover:scale-105">
                    <step.icon className="size-10 text-primary group-hover:scale-110 transition-transform duration-300" />
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-sm ring-4 ring-background shadow-sm">
                      {step.step}
                    </div>
                  </div>
                  <div className="pt-2 px-2">
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* STATISTICS */}
        <section className="w-full py-16 md:py-24 bg-primary/5 border-y border-border/50 relative overflow-hidden">
          {/* Decorative blobs */}
          <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-blob-delay-4 pointer-events-none" />
          <div className="container mx-auto px-4 md:px-6 w-full relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto w-full">
              {[
                { icon: Car, value: "5 000+", label: "Авто обслужено" },
                { icon: Users, value: "3 200+", label: "Задоволених клієнтів" },
                { icon: Award, value: "12+", label: "Років досвіду" },
                { icon: Timer, value: "98%", label: "Вчасне виконання" },
              ].map((stat, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={i}
                  className="flex flex-col items-center text-center space-y-3 p-6"
                >
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform duration-300">
                    <stat.icon className="size-7 text-primary" />
                  </div>
                  <span className="text-3xl md:text-4xl font-extrabold text-foreground animate-number-glow">{stat.value}</span>
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12 w-full"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Що кажуть наші клієнти</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Реальні відгуки від людей, які довірили нам свої автомобілі.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto w-full">
              {[
                { name: "Олександр К.", car: "BMW X5, 2020", rating: 5, text: "Чудовий сервіс! Зробили діагностику за годину, знайшли проблему з підвіскою, яку інші СТО не могли виявити. Рекомендую всім!" },
                { name: "Марина В.", car: "Toyota Camry, 2019", rating: 5, text: "Записалася онлайн, все було готово точно в строк. Дуже зручний CRM-кабінет, де видно всю історію обслуговування мого авто." },
                { name: "Дмитро Л.", car: "Volkswagen Golf, 2021", rating: 5, text: "Прозорі ціни, ніхто не нав'язує непотрібні послуги. Залишив авто на планове ТО — все ідеально. Буду повертатись!" },
              ].map((review, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={i}
                  className="w-full"
                >
                  <Card className="h-full bg-card hover:border-primary/30 transition-colors">
                    <CardContent className="p-6 flex flex-col gap-4 h-full">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <MessageSquareQuote className="size-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm">{review.name}</p>
                          <p className="text-xs text-muted-foreground">{review.car}</p>
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {Array.from({ length: review.rating }).map((_, j) => (
                          <Star key={j} className="size-4 text-yellow-500 fill-yellow-500" />
                        ))}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed flex-1">{review.text}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="w-full py-16 md:py-24 bg-secondary/10">
          <div className="container mx-auto px-4 md:px-6 w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col items-center justify-center space-y-4 text-center mb-12 w-full"
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Часті питання</h2>
              <p className="max-w-[700px] text-muted-foreground md:text-lg">
                Відповіді на популярні запитання наших клієнтів.
              </p>
            </motion.div>

            <div className="max-w-3xl mx-auto w-full space-y-3">
              {[
                { q: "Як записатися на сервіс?", a: "Ви можете записатися онлайн через наш CRM-кабінет, зателефонувати нам або залишити заявку на сайті. Після реєстрації вам буде доступний зручний особистий кабінет." },
                { q: "Скільки часу займає діагностика?", a: "Комп'ютерна діагностика зазвичай займає від 30 хвилин до 1 години, залежно від складності. Ми завжди повідомляємо орієнтовний час при записі." },
                { q: "Чи надаєте ви гарантію на роботи?", a: "Так, ми даємо гарантію від 6 місяців до 2 років на всі виконані роботи та встановлені запчастини. Термін гарантії залежить від типу послуги." },
                { q: "Які марки автомобілів ви обслуговуєте?", a: "Ми обслуговуємо автомобілі всіх популярних марок: BMW, Mercedes, Audi, Volkswagen, Toyota, Honda, Hyundai, Kia та інші. Наші спеціалісти мають досвід роботи з різними брендами." },
                { q: "Чи можна залишити авто на ніч?", a: "Так, у нас є охоронювана стоянка. Ви можете залишити автомобіль на ніч або на кілька днів, якщо ремонт потребує більше часу." },
              ].map((faq, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  viewport={{ once: true, margin: "-50px" }}
                  key={i}
                  className="w-full"
                >
                  <div
                    className="rounded-xl border border-border/50 bg-card overflow-hidden transition-colors hover:border-primary/30"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                      className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
                    >
                      <span className="font-semibold text-foreground pr-4">{faq.q}</span>
                      <ChevronDown className={`size-5 text-muted-foreground shrink-0 transition-transform duration-300 ${openFaqIndex === i ? 'rotate-180' : ''}`} />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaqIndex === i ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                    >
                      <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="w-full py-20 bg-primary/5 border-y border-border/50 relative overflow-hidden">
          <div className="container mx-auto px-4 md:px-6 relative z-10 w-full">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto w-full"
            >
              <div className="space-y-4 max-w-lg text-center md:text-left px-2 sm:px-0">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Готові записатися на сервіс?</h2>
                <p className="text-muted-foreground text-base sm:text-lg">
                  Реєструйтесь в нашому CRM-кабінеті, щоб легко керувати історією авто та записуватись онлайн.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full sm:w-auto">
                {!isAuthenticated ? (
                  <>
                    <Link href="/register" className="w-full sm:w-auto">
                      <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base w-full">
                        Реєстрація клієнта
                      </Button>
                    </Link>
                    <Link href="/login" className="w-full sm:w-auto">
                      <Button size="lg" variant="outline" className="rounded-full h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base bg-background w-full">
                        Увійти
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard" className="w-full sm:w-auto">
                    <Button size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base w-full">
                      Перейти в кабінет
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer id="contacts" className="w-full bg-card border-t border-border py-12">
        <div className="container mx-auto px-4 md:px-6 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full">
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center gap-2">
                <div className="flex size-6 items-center justify-center rounded bg-primary">
                  <Wrench className="size-3 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold">WagGarage</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Ваш надійний партнер у питаннях автосервісу.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Контакти</h4>
              <ul className="space-y-2 text-sm text-muted-foreground w-full">
                <li className="flex items-center gap-2 break-all"><Phone className="size-4 shrink-0" /> +380 (99) 123-45-67</li>
                <li className="flex items-center gap-2 break-all"><Mail className="size-4 shrink-0" /> info@waggarage.com</li>
                <li className="flex items-start gap-2 break-words"><MapPin className="size-4 shrink-0 mt-0.5" /> м. Запоріжжя, вул. Перемоги, 20</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Графік роботи</h4>
              <ul className="space-y-2 text-sm text-muted-foreground w-full max-w-[180px]">
                <li className="flex justify-between w-full"><span>Пн-Пт:</span> <span>09:00 - 19:00</span></li>
                <li className="flex justify-between w-full"><span>Сб:</span> <span>10:00 - 16:00</span></li>
                <li className="flex justify-between w-full"><span>Нд:</span> <span>Вихідний</span></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-semibold">Клієнтам</h4>
              <ul className="space-y-2 text-sm w-full">
                <li><Link href="/login" className="text-muted-foreground hover:text-primary transition-colors">Особистий кабінет</Link></li>
                <li><Link href="/register" className="text-muted-foreground hover:text-primary transition-colors">Реєстрація</Link></li>
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors">Запис на сервіс</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/50 text-center text-sm text-muted-foreground flex flex-col items-center justify-center w-full">
            <p>© {new Date().getFullYear()} WagGarage CRM. Всі права захищені.</p>
          </div>
        </div>
      </footer>

      {/* SCROLL TO TOP BUTTON */}
      <AnimatePresence>
        {showScrollTopButton && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50"
          >
            <Button
              onClick={scrollToTop}
              size="icon"
              className="rounded-full w-12 h-12 shadow-xl hover:shadow-primary/50 transition-shadow"
              aria-label="Повернутись нагору"
            >
              <ArrowUp className="size-5" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
