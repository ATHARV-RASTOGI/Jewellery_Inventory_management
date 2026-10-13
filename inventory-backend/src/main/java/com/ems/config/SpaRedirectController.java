package com.ems.config;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class SpaRedirectController {

    /**
     * Forwards client-side SPA routes to index.html so TanStack Router can handle them.
     */
    @GetMapping("/login")
    public String forwardSpaLogin() {
        return "forward:/index.html";
    }
}
