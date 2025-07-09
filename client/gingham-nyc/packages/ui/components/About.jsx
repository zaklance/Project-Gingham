import React from 'react';

function About() {
    return(
        <div>
            <title>gingham • About</title>
            <h1>The Story Behind GINGHAM</h1>
            <div className="box-bounding column-3">
                <img className="img-vendor" src="/site-images/gingham-co-founders.jpg" alt="Vinh, Sandro, & Zak" />
                <article>
                    <p className='first-letter'>Like all good origin stories, ours starts with three people hitting pause on life.</p>
                    <br/>
                    <p>
                        <span className='text-500'>Zak</span>, an architect.
                        <br/>
                        <span className='text-500'>Sandro</span>, a product manager.
                        <br/>
                        <span className='text-500'>Vinh</span>, a musician.
                    </p>
                    <br/>
                    <p>
                        Three very different paths converging at Flatiron School’s software engineering bootcamp—what 
                        we (and our friends) affectionately call summer camp for adults who overthink CSS—in the 
                        spring and summer of 2024. Zak and Sandro, both based in New York City (though Zak claims 
                        he’s “from all over”), met Vinh, a Lincoln, Nebraska-born creative with a love for rhythm 
                        and code.
                    </p>
                    <br/>
                    <p>
                        It began with liquid lunches during class days to brainstorm ideas—and occasionally nod 
                        off during afternoon sessions. Then came post-class hangs at a local, cash-only dive bar 
                        in the East Village. Somewhere between debugging JavaScript, screaming at GitHub, and 
                        arguing over tabs vs. spaces, we realized: we work well together.
                    </p>
                    <br/>
                    <p>
                        Our first group project was a game called MûFO— pronounced “moo-eff-oh” (a nod to the cows). 
                        The concept? Players control UFOs sent to Earth to capture as many cows as possible while 
                        dodging the military and conspiracy theorists. Equal parts absurd and ambitious, MuFO was 
                        a celebration of our newfound coding knowledge with our different strengths—Zak’s design 
                        chops, Vinh’s original music compositions, and Sandro’s product intuition—all coming 
                        together to push the limits of a Python package called Pygame.
                    </p>
                    <br/>
                    <p>
                        <span className='font-cera-gingham text-italic'>GINGHAM</span> came next—our final group project at bootcamp. This time, we wanted to build something real.
                    </p>
                    <br/>
                    <p>
                        Zak, the aspiring environmentalist, dreamed of a way to support farmers' markets and reduce 
                        food waste. Vinh, passionate about supporting local businesses, wanted to give small 
                        vendors a louder voice. Sandro, the business-minded marketer, saw an opportunity to 
                        reimagine how people shop locally. Together, the team sought to build a tech-driven 
                        platform with a customer-first approach.
                    </p>
                    <br/>
                    <p>
                        And alas, <span className='font-cera-gingham'>gingham</span> was born.
                    </p>
                    <br/>
                    <p>
                        Today, <span className='font-cera-gingham'>gingham</span> is an early-stage digital marketplace that helps farmers'market vendors 
                        tap into an additional revenue stream through a preorder-for-pickup model. It’s simple, 
                        sustainable, and built to strengthen the bond between local farmers and makers with 
                        conscious consumers.
                    </p>
                    <br/>
                    <p>
                        We’ve been tirelessly working on <span className='font-cera-gingham'>gingham</span> ever since bootcamp, and we’re so excited to 
                        finally share it with you. It’s been a journey—and we’re only just getting started.
                    </p>
                    <br/>
                    <p>
                        — Zak, Sandro & Vinh
                        <br/>
                        &emsp;Co-founders of <span className='font-cera-gingham text-size-1-2'>gingham</span>
                    </p>
                </article>
            </div>
        </div>
    )

}

export default About;

